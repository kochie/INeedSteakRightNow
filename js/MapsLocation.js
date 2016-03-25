// Note: This example requires that you consent to location sharing when
// prompted by your browser. If you see the error "The Geolocation service
// failed.", it means you probably did not give permission for the browser to
// locate you.


/**
 * Initialises a map object for the page.
 *
 * @author - Robert A. Koch
 * @date - 29/10/15
 */
function enableScrollingWithMouseWheel(map) {
    map.setOptions({ scrollwheel: true });
}

function disableScrollingWithMouseWheel(map) {
    map.setOptions({ scrollwheel: false });
}


function initMap() {

    var mapParameters = {
        center: {lat: -34.397, lng: 150.644},
        zoom: 13,
        scrollwheel: false
    }; // Map Options for map

    var map = new google.maps.Map(document.getElementById('map'), mapParameters); // Map instance created with mapParameters
    var markers = []; // Created empty array to store all map overlay objects
    var directionsService = new google.maps.DirectionsService; // creates a new instance of directions service
    var directionsDisplay = new google.maps.DirectionsRenderer; // creates a new instance of directions display
    var geocoder = new google.maps.Geocoder; // Creates a new GeoCoder service to decode addresses and LatLng.

    directionsDisplay.setMap(map); // Sets the map to use the directions display on.
    directionsDisplay.setPanel(document.getElementById('direction')); // Sets the panel to display the directions on.

    /**
    findCurrentPosition(
        function(position){
            getSteak(position, map, geocoder, markers, directionsService, directionsDisplay)
        },
    map);
     **/

    submitButton_Callback(map, geocoder, markers, directionsService, directionsDisplay);

    findLocationButton_Callback(map, geocoder);

    google.maps.addListener(map, 'mousedown', function(){
        enableScrollingWithMouseWheel(map)
    });

    $('body').on('mousedown', function(event) {
        var clickedInsideMap = $(event.target).parents('#map').length > 0;

        if(!clickedInsideMap) {
            disableScrollingWithMouseWheel(map);
        }
    });

    $(window).scroll(function() {
        disableScrollingWithMouseWheel(map);
    });
}

function findLocationButton_Callback(map, geocoder){
    $('#find-location').click(function (e) {
        e.preventDefault();

        findCurrentPosition(function(position){
            geocoder.geocode({'location': {lat: position.coords.latitude, lng: position.coords.longitude}}, function(results, status) {
                if (status === google.maps.GeocoderStatus.OK) {
                    if (results[0]) {
                        document.getElementById('address').value = results[0].formatted_address;
                    } else {
                        window.alert('No results found');
                    }
                } else {
                    window.alert('Geocoder failed due to: ' + status);
                }
            });
        },
        map);
    });
}

function submitButton_Callback(map, geocoder, markers, directionsService, directionsDisplay){
    $('#address_form').submit(function (e) {
        e.preventDefault();
        var address;
        if (!(document.getElementById('address').value)){
            address = document.getElementById('address').placeholder;
        }
        else{
            address = document.getElementById('address').value;
        }
        delete_markers(markers);

        geocoder.geocode({'address': address}, function(results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                var location = {coords:{latitude:results[0].geometry.location.lat(),longitude:results[0].geometry.location.lng()}};

                getSteak(location, map, geocoder, markers, directionsService, directionsDisplay);

            } else {
                alert('Geocode was not successful for the following reason: ' + status);
            }
        });
    });
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
        'Error: The Geolocation service failed.' :
        'Error: Your browser doesn\'t support geolocation.');
}


function getSteak(position, map, geocoder, markers, directionsService, directionsDisplay){
    var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    var marker = new google.maps.Marker({
        map: map,
        position: pos
    });

    var circle_params = {
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#FF0000',
        fillOpacity: 0.10,
        map: map,
        center: pos,
        radius: 1000
    };

    var cityCircle = new google.maps.Circle(circle_params);

    var request = {
        location: pos,
        radius: '10000',
        query: 'steakhouse OR steak',
        openNow: true
    };

    var open_info;
    var min_distance = Infinity;
    var min_marker;
    var min_info;

    var service = new google.maps.places.PlacesService(map);

    markers.push(marker);
    map.setCenter(pos);
    markers.push(cityCircle);

    geocoder.geocode({'location': {lat: position.coords.latitude, lng: position.coords.longitude}}, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
            if (results[0]) {
                document.getElementById('address').value = results[0].formatted_address;
            } else {
                window.alert('No results found');
            }
        } else {
            window.alert('Geocoder failed due to: ' + status);
        }
    });

    service.textSearch(request, function(results, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            console.log(results.length);
            for (var i = 0; i < results.length; i++) {
                var place = results[i];
                // If the request succeeds, draw the place location on
                // the map as a marker, and register an event to handle a
                // click on the marker.
                var marker = new google.maps.Marker({
                    map: map,
                    position: place.geometry.location
                });

                markers.push(marker);
                var distance = getDistanceFromLatLonInKm(pos.lat(), pos.lng(), place.geometry.location.lat(), place.geometry.location.lng());

                var request = {
                    placeId: place.place_id
                };

                var infowindow = new google.maps.InfoWindow();



                if (distance < min_distance){
                    min_marker = marker;
                    min_distance = distance;
                    min_info = infowindow;
                }

                /**
                (function(e){
                    service.getDetails(request, function (place, status) {
                        if (status == google.maps.places.PlacesServiceStatus.OK) {
                            // If the request succeeds, draw the place location on the map
                            // as a marker, and register an event to handle a click on the marker.
                            var website = place.website;
                            var phone_number = place.formatted_phone_number;
                            var photos = place.photos;
                            e.setContent('<a class="infoWindow" href="#about">' + place.name + "</a>" + "<br />Phone Number: " + place.formatted_phone_number);
                        }});
                })(infowindow);
                 **/

                (function(infowindow, a, request){
                    marker.addListener('click', function() {
                        if (open_info){
                            open_info.close();
                        }
                        if (!infowindow.name){
                            placeInfo(service, request, infowindow);
                        }
                        infowindow.open(map, a);
                        open_info = infowindow;
                        calculateAndDisplayRoute(directionsService, directionsDisplay, pos, a.getPosition());
                        defaultImages();
                        setTimeout(function(){
                            showImages(infowindow.photos);
                                publishInfo(infowindow);
                            console.log(infowindow.name);
                            console.log(infowindow.photos);
                            console.log(infowindow.rating);
                        }, 500
                        );


                    });
                })(infowindow, marker, request);
            }

            google.maps.event.trigger(min_marker, 'click');
        }
    });
}

function setMapOnAll(the_map, markers) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(the_map);
    }
}

function clearMarkers(markers) {
    setMapOnAll(null, markers);
}

function delete_markers(markers){
    clearMarkers(markers);
    markers = [];
    return markers;
}

function calculateAndDisplayRoute(directionsService, directionsDisplay, origin, destination) {
    directionsService.route({
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING
    }, function(response, status) {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(response);
        } else {
            window.alert('Directions request failed due to ' + status);
        }
    });
}

function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-lat1);  // deg2rad below
    var dLon = deg2rad(lon2-lon1);
    var a =
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function deg2rad(deg) {
    return deg * (Math.PI/180)
}

function findCurrentPosition(onSuccess, map){
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position){
                onSuccess(position)
            },
            function(){
                handleLocationError(true, new google.maps.InfoWindow(), map.getCenter());
            }
        );
    }
    else{
        // Browser doesn't support Geolocation
        handleLocationError(false, new google.maps.InfoWindow(), map.getCenter());
    }
}

function placeInfo(service, request, infowindow){
    service.getDetails(request, function (place, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            // If the request succeeds, draw the place location on the map
            // as a marker, and register an event to handle a click on the marker.
            var photos = place.photos;
            var url_list = [];

            if (photos){
                for (var i = 0; i < photos.length; i++){
                    url_list.push(photos[i].getUrl({maxWidth: 1300}));
                }
            }

            infowindow.name = place.name;
            infowindow.phone = place.formatted_phone_number;
            infowindow.website = place.website;
            infowindow.rating = place.rating;
            infowindow.pricelevel = place.price_level;
            infowindow.photos = url_list;
            infowindow.reviews = place.reviews;

            infowindow.setContent(
                    '<a class="infoWindow" href="#about">' + place.name + "</a>" +
                    "<br>Phone Number: " + place.formatted_phone_number + "<br>" +
                    '<a href=' + place.website + '>' + 'Website' + '</a>'
            );




        }});
}

function publishInfo(infowindow){
    var $content = $('#content');
    $content.html(
        infowindow.name + '<br>' +
        infowindow.phone + '<br>' +
        infowindow.pricelevel + '<br>' +
        infowindow.rating + '<br>' +
            infowindow.reviews
    )
    console.log(infowindow.reviews);

}

function showImages(url_list){
    console.log('test');
    $('#img-1-temp').removeAttr('src').attr("src", url_list[0]);
    cropImage('#img-1-temp', '#img-1-div', 'img-1');
    $('#img-1').addClass('img-responsive');
    $('#img-2-temp').removeAttr('src').attr("src", url_list[1]);
    cropImage('#img-2-temp', '#img-2-div', 'img-2');
    $('#img-2').addClass('img-responsive');
    $('#img-3-temp').removeAttr('src').attr("src", url_list[2]);
    cropImage('#img-3-temp', '#img-3-div', 'img-3');
    $('#img-3').addClass('img-responsive');
    $('#img-4-temp').removeAttr('src').attr("src", url_list[3]);
    cropImage('#img-4-temp', '#img-4-div', 'img-4');
    $('#img-4').addClass('img-responsive');
    $('#img-5-temp').removeAttr('src').attr("src", url_list[4]);
    cropImage('#img-5-temp', '#img-5-div', 'img-5');
    $('#img-5').addClass('img-responsive');
    $('#img-6-temp').removeAttr('src').attr("src", url_list[5]);
    cropImage('#img-6-temp', '#img-6-div', 'img-6');
    $('#img-6').addClass('img-responsive');
}

function defaultImages(){
    $('#img-1').attr("src", "img/portfolio/1.jpg").removeAttr('style').addClass('img-responsive');
    $('#img-1-div').removeAttr('style');
    $('#img-2').attr("src", "img/portfolio/2.jpg").removeAttr('style').addClass('img-responsive');
    $('#img-2-div').removeAttr('style');
    $('#img-3').attr("src", "img/portfolio/3.jpg").removeAttr('style').addClass('img-responsive');
    $('#img-3-div').removeAttr('style');
    $('#img-4').attr("src", "img/portfolio/4.jpg").removeAttr('style').addClass('img-responsive');
    $('#img-4-div').removeAttr('style');
    $('#img-5').attr("src", "img/portfolio/5.jpg").removeAttr('style').addClass('img-responsive');
    $('#img-5-div').removeAttr('style');
    $('#img-6').attr("src", "img/portfolio/6.jpg").removeAttr('style').addClass('img-responsive');
    $('#img-6-div').removeAttr('style');
}