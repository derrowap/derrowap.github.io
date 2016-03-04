$(document).ready(function() {
	$('#header #myNavbar a[href="' + this.location.pathname + '"]').parent().addClass('active');
	$("#my-video").backgroundVideo({
		$videoWrap: $('#video-wrap'),
		$outerWrap: $('#outer-wrap'),
		preventContextMenu: true,
		parallax: true,
		parallaxOptions: {
			effect: 1.0 /* degree of parallax (1.0 is fixed) */
		}
	});
});
