/*
Author: 		Austin Derrow-Pinion
Purpose: 		Develop website to showcase projects and skills
Technologies:	HTML, JavaScript, CSS, Bootstrap, JQuery, 
				backgroundVideo plugin, Google Doc pdf viewer plugin,
				Github, CloudFlare, GoDaddy
Description:
This website was to further my experience with web development and learn
new technologies used with web development. By showcasing my projects and
information about me, I am able to easily provide employers with details
of my experience and talents.
*/
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
