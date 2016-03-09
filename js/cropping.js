/**
 * Created by Robert on 29/11/2015.
 */

function cropImage(source, destination, id) {
    var $previews = $(destination);
    if ($(source).cropper) {
        $(source).cropper('destroy');
    }


    $(source).cropper({
        aspectRatio: 650/350,
        autoCropArea: 1,
        build: function () {
            var $clone = $(this).clone();
            $clone.attr("id", id);
            console.log($clone);

            $clone.css({
                display: 'block',
                width: '100%',
                minWidth: 0,
                minHeight: 0,
                maxWidth: 'none',
                maxHeight: 'none'
            });

            $previews.css({
                width: '100%',
                overflow: 'hidden'
            }).html($clone);
        },

        crop: function(e) {
            var imageData = $(this).cropper('getImageData');
            var previewAspectRatio = 650/350; //e.width / e.height;

            $previews.each(function() {
                var $preview = $(this);
                var previewWidth = $preview.width();
                var previewHeight = previewWidth / previewAspectRatio;
                var imageScaledRatio = e.width / previewWidth;

                $preview.height(previewHeight).find('img').css({
                    width: imageData.naturalWidth / imageScaledRatio,
                    height: imageData.naturalHeight / imageScaledRatio,
                    marginLeft: -e.x / imageScaledRatio,
                    marginTop: -e.y / imageScaledRatio
                });
            });
        }
    });
};