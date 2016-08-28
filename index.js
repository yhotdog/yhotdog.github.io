var intro = $('#intro');
var header = $('.header');
var elementToScroll = $('body,html');
var folds = $('.fold').toArray();

function getHeaderHeight() {
    return header.outerHeight();
}

function snapToFold(fold) {
    if (fold) {
        stopSnap();
        elementToScroll.animate({
            scrollTop: $(fold).offset().top - getHeaderHeight()
        }, 500);
        var foldLinkSelector = '.header a.fold-link';
		$(foldLinkSelector).removeClass('selected-link')
		$(foldLinkSelector + '[href=#' + fold.id + ']').addClass('selected-link')
    }
}

function stopSnap() {
    elementToScroll.stop();
}

function getDocumentScrollTop() {
    return $(document).scrollTop();
}

function findNearestFold(hint) {
    var documentScrollTop = getDocumentScrollTop();
    var distances = folds.map(function getDistanceFromScreenTop(fold) {
        return $(fold).offset().top - documentScrollTop;
    });
    var smallestDist = distances.reduce(function (smallestDist, dist) {
        if (smallestDist === undefined) {
            if (hint === undefined) {
                return dist;
            }
            else if (hint === 'down') {
                return dist > getHeaderHeight() + 10 ? dist : undefined; // plus 10 because it it doesn't work when the screen is un-magnified
            }
            else if (hint === 'up') {
                return dist < 0 ? dist : undefined;
            }
            return undefined;
        }
        else if (hint === 'down') {
            return dist > getHeaderHeight() && dist < smallestDist ? dist : smallestDist;
        }
        else if (hint === 'up') {
            return dist < 0 && -dist < -smallestDist ? dist : smallestDist;
        }
        else {
            return Math.abs(dist) < Math.abs(smallestDist) ? dist : smallestDist;
        }
    }, undefined);
    var nearestFoldIndex = distances.indexOf(smallestDist);
    if (nearestFoldIndex === 0 && hint !== 'up') {
        // prevent auto-snap to the first fold (unless the user explicitly wanted so - by pressing the up arrow)
        return undefined;
    }
    return folds[nearestFoldIndex];
}

function setUpScrollToFold() {
    $('.fold-link').click(function () {
        var href = $.attr(this, 'href');
        snapToFold($(href)[0]);
        return false;
    });

    var scrolling = false;
    var snapTimout = null;
    $(window).on('keydown', function (event) {
        var hint;
        if (event.keyCode === /* up */ 38 ||
          event.keyCode === /* page up */ 33) {
            hint = 'up';
        }
        else if (event.keyCode === /* down */ 40 ||
          event.keyCode === /* page down */ 34) {
            hint = 'down';
        }
        if (hint !== undefined) {
            snapToFold(findNearestFold(hint));
            clearTimeout(snapTimout);
            event.preventDefault();
        }

        var galleryNavigation = {
            37: 'prev',
            39: 'next'
        }[event.keyCode];
        if (galleryNavigation !== undefined) {
            var gallery = $(findNearestFold()).find('.gallery');
            if (gallery.length > 0) {
                gallery.slick(galleryNavigation);
            }
        }
    });
    $(window).on('mousedown', function () {
        scrolling = true;
    });
    $(window).on('mouseup', function (event) {
        if (event.target.tagName === 'A') {
            return;
        }
        snapToFold(findNearestFold());
        scrolling = false;
    });
    $(window).on('mousewheel DOMMouseScroll', function () {
        stopSnap();
        clearTimeout(snapTimout);
        snapTimout = setTimeout(function () {
            snapToFold(findNearestFold());
            snapTimout = null;
        }, 500);
    });
}

function updateHeaderVisibility() {
    var confidence = 1; // this confidence is good when the user clicks on the link of the first fold, and we don't want the header to disappear
    header[getDocumentScrollTop() > intro.outerHeight() - getHeaderHeight() - confidence ? 'addClass' : 'removeClass']('visible');
}
function setUpHeader() {
    window.onscroll = updateHeaderVisibility;
}

function setUpGalleries() {
    var galleries = $('.gallery');
    galleries.on('init', function () {
        galleries.addClass('ready');
    });
    galleries.on('beforeChange', function startGifFromBeginning(event, slick, currentSlide, nextSlide) {
        if (currentSlide !== nextSlide) {
            var screen = $(slick.$slides[nextSlide]).find('img.screen');
            screen.attr('src', screen.attr('src'));
        }
    });
    galleries.slick({
        prevArrow: '<a class="gallery-prev" />',
        nextArrow: '<a class="gallery-next" />',
        dots: true

        // Interesting settings to experiment with:
//            mobileFirst: true,
//            swipeToSlide: true
    });
}

function main() {
    setUpScrollToFold();
    setUpHeader();
    updateHeaderVisibility();
    setUpGalleries();
}

main();