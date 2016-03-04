/*
Author: 		Austin Derrow-Pinion
Purpose: 		Develop website to showcase projects and skills
Technologies:	HTML, JavaScript, CSS, Bootstrap, JQuery, 
				Google Analytics, backgroundVideo plugin, 
				Google Doc pdf viewer plugin,Github, CloudFlare, 
				GoDaddy
Description:
This website was to further my experience with web development and learn
new technologies used with web development. By showcasing my projects and
information about me, I am able to easily provide employers with details
of my experience and talents.
*/
$(document).ready(function() {
	/* creates parallax effect on video */
	$("#my-video").backgroundVideo({
		$videoWrap: $('#video-wrap'),
		$outerWrap: $('#outer-wrap'),
		preventContextMenu: true,
		parallax: true,
		parallaxOptions: {
			effect: 1.0 // degree of parallax (1.0 is fixed)
		}
	});

	/* fired when a navigation bar element is clicked */
	$('.nav a').on('click', function(e) {
		/* when screen is small, this makes it disappear when clicked */
		$('.navbar-collapse').collapse('hide');

		/* prevents default animation from happening */
		e.preventDefault();

		var hash = this.hash; // used for window location

		/* makes animation to new location on page smooth and slower */
		$('html, body').animate({ scrollTop: $(hash).offset().top },
			500, function() { window.location.hash = hash; });
	});
});

/* Makes the correct Navigation Bar element active while scrolling */
$(window).scroll(function() {
	var windscroll = $(window).scrollTop();
	
	if (windscroll >= 100) { // window has been scrolled down
		$('.page-section').each(function(i) {
			/* offset by 50 to make switching occur at a more natural time */
			if ($(this).position().top <= windscroll + 50) {
				$('#myNavbar li.active').removeClass('active');
				$('#myNavbar li').eq(i).addClass('active');
			}
		});
	} else { // window is at top of page
		$('#myNavbar li.active').removeClass('active');
		$('#myNavbar li:first').addClass('active');
	}
}).scroll();