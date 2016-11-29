// Img2SVG Convertion
// =========================================================================

(function($) {

    $.fn.convert2svg = function() {
        var $img = $(this);
        var imgID = $img.attr('id');
        var imgClass = $img.attr('class');
        var imgURL = $img.attr('src');

        jQuery.get(imgURL, function(data) {
            // Get the SVG tag, ignore the rest
            var $svg = jQuery(data).find('svg');

            // Add replaced image's ID to the new SVG
            if (typeof imgID !== 'undefined') {
                $svg = $svg.attr('id', imgID);
            }
            // Add replaced image's classes to the new SVG
            if (typeof imgClass !== 'undefined') {
                $svg = $svg.attr('class', imgClass + ' replaced-svg');
            }

            // Remove any invalid XML tags as per http://validator.w3.org
            $svg = $svg.removeAttr('xmlns:a');

            // Replace image with new SVG
            $img.replaceWith($svg);

        }, 'xml');
    };

})(jQuery);


// AJAX History management
// =========================================================================

var siteUrl = 'http://' + (document.location.hostname || document.location.host);

$(document).delegate('a[href^="/"],a[href^="' + siteUrl + '"]', "click", function(e) {
    console.log("delegate");
    e.preventDefault();
    History.pushState({}, "", this.pathname);
});

History.Adapter.bind(window, 'statechange', function() {
    console.log("statechange");
    var State = History.getState();
    console.log(State);
    $.get(State.url, function(data) {
        document.title = $(data).filter("title").text();
        $('#container').html($(data).filter('#container').children());
        $('#container').find('script').each(function() {
            if (typeof $(this).attr('src') != 'undefined') {
                $.getScript($(this).attr('src'));
            } else {
                eval($(this).innerHtml);
            }
        });
        // _gaq.push(['_trackPageview', State.url]);
    }).fail(function(){
        $('#container').html("<p>Error 404</p>");
    });
});
