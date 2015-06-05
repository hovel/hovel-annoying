;
(function ($) {
    var magnifier = new function () {
        var self = this;

        self.ratioScale = [1.5, 2, 3];

        self.run = function () {
            $('.scalable, .scalable-bg').each(function () {
                var $el = $(this);
                if ($el.hasClass('scalable')) {
                    switch ($el.prop('tagName').toLowerCase()) {
                        case 'a':
                            self.updateAnchor($el);
                            break;
                        case 'img':
                            self.updateImage($el);
                            break;
                        case 'video':
                            self.updateVideo($el);
                            break;
                    }
                }
                if ($el.hasClass('scalable-bg')) {
                    self.updateBackground($el);
                }
            });
        };

        self.updateAnchor = function ($el) {
            var url = $el.attr('href'),
                newURL = self.buildURL(url);
            if (newURL != url) {
                $el.attr('href', newURL);
            }
        };

        self.updateImage = function ($el) {
            var url = $el.attr('src'),
                newURL = self.buildURL(url);
            if (newURL != url) {
                $el.attr('src', newURL);
            }
        };

        self.updateVideo = function ($el) {
            if (!$el.prop('paused')) {
                return;
            }

            var posterURL = $el.attr('poster');
            if (posterURL) {
                var newPosterUrl = self.buildURL(posterURL);
                if (newPosterUrl != posterURL) {
                    $el.attr('poster', newPosterUrl);
                }
            }

            var videoURL = $el.prop('currentSrc');
            if (videoURL) {  // if currentSrc is supported
                var newVideoURL = self.buildURL(videoURL);
                if (newVideoURL != videoURL) {
                    $el.attr('src', newVideoURL);
                }
            }
        };

        self.updateBackground = function ($el) {
            var bgSize = $el.css('background-size');
            // not supported || auto in chrome/opera/ie || auto in firefox
            if (!bgSize || bgSize == 'auto' || bgSize == 'auto auto') {
                console.warn('Conflict:', $el.get(0), 'has background-size: auto.');
                return;
            }

            var url = $el.css('background-image');
            if (url && url.indexOf('url') === 0) {
                url = url.replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '');
                var newUrl = self.buildURL(url);
                if (newUrl != url) {
                    $el.css('background-image', 'url("' + newUrl + '")');
                }
            }
        };

        self.buildURL = function (url) {
            if (url.indexOf('svg', url.length - 3) !== -1) {
                return url;
            }
            // ([^@]+) capture all until @ if exists, otherwise until .jpg
            // (?:@[0-9]+\.?[0-9]?x)? throw away @ integer+ .? fractional? x
            // (\.[^.]{1,4}) capture extension with .
            var parts = url.split(/([^@]+)(?:@[0-9]+\.?[0-9]?x)?(\.[^.]{1,4})/i),
                ratio = self.getRatio();
            if (ratio === 1) {
                return parts[1] + parts[2];
            } else {
                return parts[1] + '@' + ratio + 'x' + parts[2];
            }
        };

        self.getRatio = function () {
            for (var i = self.ratioScale.length - 1; i >= 0; i--) {
                if (window.devicePixelRatio >= self.ratioScale[i]) {
                    return self.ratioScale[i];
                }
            }
            return 1;
        };

    };

    var resizeTimer = setTimeout(function () {}, 0);
    $(window).on('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            $(window).trigger('resizeend.scalableMediaSources');
        }, 500)
    });

    $(function () {
        var initialRatio = magnifier.getRatio();

        if (initialRatio !== 1) {
            magnifier.run();
            $(window).trigger('change.scalableMediaSources', {prev: 1, current: initialRatio});
        }

        var prevRatio = initialRatio;
        $(window).on('resizeend.scalableMediaSources', function () {
            var currentRatio = magnifier.getRatio();
            magnifier.run();
            $(window).trigger('change.scalableMediaSources', {prev: prevRatio, current: currentRatio});
            prevRatio = currentRatio;
        });
    });
})(jQuery);
