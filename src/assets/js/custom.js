	/*

Template:  Webmin - React Admin Dashboard Template
Author: potenzaglobalsolutions.com
Design and Developed by: potenzaglobalsolutions.com

NOTE: This file contains all scripts for the actual Template.

*/

/*================================================
[  Table of contents  ]
================================================


:: Search
:: Fullscreenwindow

 
======================================
[ End table content ]
======================================*/
//POTENZA var
 (function($){
  var POTENZA = {};

  /*************************
  Predefined Variables
*************************/ 
   var $document = $(document);
    //Check if function exists
    $.fn.exists = function () {
        return this.length > 0;
    };


  

/*************************
       Search
*************************/ 
POTENZA.searchbox = function () {
   if (jQuery('.search').exists()) {
      jQuery('.search-btn').on("click", function () {
         jQuery('.search').toggleClass("search-open");
           return false;
          });
       jQuery("html, body").on('click', function (e) {
        if (!jQuery(e.target).hasClass("not-click")) {
             jQuery('.search').removeClass("search-open");
         }
     });
    }
}     



/*************************
    Fullscreenwindow
*************************/ 

POTENZA.Fullscreenwindow = function () { 
    if ($('#btnFullscreen').exists()) {
   function toggleFullscreen(elem) {
    elem = elem || document.documentElement;
    if (!document.fullscreenElement && !document.mozFullScreenElement &&
      !document.webkitFullscreenElement && !document.msFullscreenElement) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  }
  document.getElementById('btnFullscreen').addEventListener('click', function() {
    toggleFullscreen();
  });
 }
}


/****************************************************
     POTENZA Window load and functions
****************************************************/
 
 //Document ready functions
    $document.ready(function () {
        POTENZA.searchbox();
        POTENZA.Fullscreenwindow();
    });
})(jQuery);






