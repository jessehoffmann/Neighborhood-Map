'use strict';
//globle variables for Google map
var map;
var markers = [];
var infowindow;
var bounds;
//google and wikipedia keys for api calls
var client_ID = "dSAwHEJQeFr9NowtHXkfvg";
var api_Key = "Kz-RWov2WC0g-DC7T917mteitJThPLPXfCoFo9WGGMm-KFgJwwDWNpI0NuLN396t22oSw9x5C55-Wd0VQ4SOqeJTQ8spUXvrYarNNM-WIP3kB2_dKi1ZexcN4-rjW3Yx";

//create dynamic variable for each place using Knockout
var Place = function(data) {
  this.showPlace = ko.observable(true);
  this.name = ko.observable(data.name);
  this.type = ko.observableArray(data.type);
  this.location = ko.observable(data.location);
  this.keyword = ko.observable(data.keyword);
  //variable for wiki api call
  this.wikisearch = ko.observable("");
  this.showWiki = ko.observable(false);
};

//Knockout function for modifying data
var ViewModel = function() {
  var self = this;
  this.placesList = ko.observableArray([]);
  //create dynamic observableArray from places data
  model.forEach( function(place) {
    self.placesList.push( new Place(place));
  });
  //empty list for filters
  this.filterList = ko.observableArray(["All Locations"]);
  //variable for user selected filter
  this.filter = ko.observable("");
  //iterate over data and add filters to list
  this.placesList().forEach( function(place) {
    place.type().forEach( function(type) {
      if (self.filterList().includes(type) != true) {
        self.filterList.push(type);
      }
    });
  });
  this.search = ko.observable("");
  //filters locations based on user selection
  this.narrowList = function() {
    for (var i = 0; i < self.placesList().length; i++) {
      var place = self.placesList()[i];
      markers[i][0].setVisible(false);
      place.showPlace(false);
      if (place.type().includes(self.filter()) == true || self.filter() == "All Locations") {
        //modify map data
        if (place.name().toUpperCase().includes(self.search().toUpperCase()) == true ||
            place.location().toUpperCase().includes(self.search().toUpperCase()) == true ||
            place.keyword().toUpperCase().includes(self.search().toUpperCase()) == true) {
          //add filtered places to toolbar
          markers[i][0].setVisible(true);
          place.showPlace(true);
        }
      }
    };
  };
  //displays details of a particular place when clicked
  this.displaydetails = function(place) {
    self.placesList().forEach( function(place) {
      place.showWiki(false);
    })
    var list_index = self.placesList.indexOf(place);
    //wikipedia api call for related info about place
    $.ajax({
      dataType: 'json',
      url: "https://en.wikipedia.org/w/api.php?",
      data: {
        action: 'opensearch',
        search: place.keyword(),
        format: 'json',
        origin: '*'
      },
      success: function(result) {
        self.placesList()[list_index].wikisearch(result[2][0]);
        place.showWiki(true);
      }
    });
    openInfoWindow(place);
    //wikipedia api call for related info about place
  };
 };

//link dynamic html bindings to javascript
ko.applyBindings(new ViewModel());

function openInfoWindow(place) {
  for (var i = 0; i < markers.length; i++) {
    if (markers[i][1] == place.name()) {
      google.maps.event.trigger(markers[i][0], 'click');
    }
  }
}

//add animation for markers
function toggleBounce(marker) {
  if (marker.getAnimation() != null) {
    marker.setAnimation(null);
  } else {
  marker.setAnimation(google.maps.Animation.BOUNCE);
  }
  setTimeout( function() {
    marker.setAnimation(null);
  }, 1500);
}

//add markers to google map given a place
function addMarker(place) {
  //find location coordinates of a place
  var geocoder = new google.maps.Geocoder();
  geocoder.geocode({
    'address': place.location
  }, function (results, status) {
    //add marker if location existss
    if (status == 'OK') {
      var marker = new google.maps.Marker({
        animation: google.maps.Animation.DROP,
        position: results[0].geometry.location,
        map: map
      });
      //push marker to global variable for tracking map data
      var marker_in_list = [marker, place.name];
      markers.push(marker_in_list);
      var content = "<h4>" + place.name + "</h4>" + "<p>" + place.location + "<p>";
      //open info windor on map when marker is clicked
      marker.addListener('click', function() {
        //add animation to markers
        toggleBounce(marker);
        //display unique location info in toolbar DOM element
        document.getElementById(place.name).click();
        //new info window
        infowindow.close();
        infowindow.setContent(content);
        infowindow.open(map, marker);
      });
      bounds.extend(results[0].geometry.location);
      map.fitBounds(bounds);
    //alert user a particular location does not exist
    } else {
      window.alert(place.name + "does not exist.")
    }
  });
};

//callback function to initialize google map api
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 34.1706, lng: -118.8376},
    zoom: 13
  });
  infowindow = new google.maps.InfoWindow({
    content: "Filler"
  });
  bounds = new google.maps.LatLngBounds();
  //use model data to populate markers and windows for map
  model.forEach( function(place) {
    addMarker(place)
  });
};

function myerrorhandler() {
  window.alert("Error Loading Google Maps API")
};
