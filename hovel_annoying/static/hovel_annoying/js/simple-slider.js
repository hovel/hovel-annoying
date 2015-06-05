;
function initSimpleSlider(prefix, settings) {
/*
    <div class="PREFIX-slider-wrapper">
        <div class="slide-control slide-control-prev PREFIX-slider-prev">
            <div class="slide-control-inner">
                <span class="glyphicon glyphicon-arrow-left"></span>
            </div>
        </div>
        <div class="slide-control slide-control-next PREFIX-slider-next">
            <div class="slide-control-inner">
                <span class="glyphicon glyphicon-arrow-right"></span>
            </div>
        </div>
        <div class="PREFIX-slider">
        </div>
    </div>
*/

    if ('onAfterSlide' in settings) {
        var func = settings['onAfterSlide'];
        settings['onAfterSlide'] = function ($el) {
            func($el);
            refrestControlsState();
        }
    } else {
        settings['onAfterSlide'] = function ($el) {
            refrestControlsState();
        }
    }

    prefix = '.' + prefix.replace(/^\./, '');

    // for controls' positioning
    $(prefix + '-slider-wrapper').css({'position': 'relative'});

    var slider = $(prefix + '-slider').lightSlider(settings);

    function refrestControlsState() {
        if ($.trim(slider.html()) == '') {
            $(prefix + '-slider-wrapper').hide();
            return;
        }

        // timeout helps to prevent a click on slide content in case of fast scrolling
        setTimeout(function () {
            $(prefix + '-slider-prev').toggle(slider.getCurrentSlideCount() !== 1);
        }, 500);
        var lastSlide = slider.children().last(),
            showNext = lastSlide.offset().left + lastSlide.width() - 10 >= slider.parent().offset().left + slider.parent().width();
        setTimeout(function () {
            $(prefix + '-slider-next').toggle(showNext);
        }, 500);
    }

    refrestControlsState();

    $(prefix + '-slider-prev').on('click', function () {
        slider.goToPrevSlide();
    });
    $(prefix + '-slider-next').on('click', function () {
        slider.goToNextSlide();
    });

    $(window).on('change.scalableMediaSources, resize', function (data) {
        slider.refresh();
        refrestControlsState();
    });

    slider.refrestControlsState = refrestControlsState;

    return slider;
}
