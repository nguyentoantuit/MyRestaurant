$(function () {
    if ($('textarea#ta').length) {
        CKEDITOR.replace('ta');
    }

    $('a.confirmDeletion').on('click', function () {
        if (!confirm('Bạn có muốn xóa không ?'))
            return false;
    });

    if ($("[data-fancybox]").length) {
        $("[data-fancybox]").fancybox();
    }
});

$(document).ready(function () {
    $("#myInput").on("keyup", function () {
        var value = $(this).val().toLowerCase();
        $("#myList li").filter(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
        });
        $("#products *").filter(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)

        });
    });
});



var prevScrollpos = window.pageYOffset;
 window.onscroll = function () {
     var currentScrollpos = window.pageYOffset;
     if (prevScrollpos > currentScrollpos){
         document.getElementById("navbar1").style.top="0";
     } else{
         document.getElementById("navbar1").style.top="-120px";
     }
     prevScrollpos = currentScrollpos
     
 }

