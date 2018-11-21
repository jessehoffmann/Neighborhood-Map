//create globle variables for Google map
var map;
var markers = [];
var bounds;
//google and wikipedia keys for api calls
var client_ID = "dSAwHEJQeFr9NowtHXkfvg";
var api_Key = "Kz-RWov2WC0g-DC7T917mteitJThPLPXfCoFo9WGGMm-KFgJwwDWNpI0NuLN396t22oSw9x5C55-Wd0VQ4SOqeJTQ8spUXvrYarNNM-WIP3kB2_dKi1ZexcN4-rjW3Yx";
//fixed data of locations to visit
var model = [
  {
    name: "Karma Baker",
    keyword: "Vegan",
    type: ["Food"],
    location: "1145 Lindero Canyon Rd. Ste D3, Westlake Village, CA 91362"
  }, {
    name: "Rave Organics",
    keyword: "Vegan",
    type: ["Food"],
    location: "520 N Ventu Park Rd. Ste 140, Newbury Park, CA 913202"
  }, {
    name: "Tushita Kadampa Buddhist Center",
    keyword: "Buddhism",
    type: ["Spiritual Growth"],
    location: "910 Hampshire Blvd. Ste I, Westlake Village, CA 91361"
  }, {
    name: "Bodysattva Healing Arts Center",
    keyword: "Alternative Medicine",
    type: ["Spiritual Growth", "Active Life"],
    location: "1414 Thousand Oaks Blvd Suite 211, Thousand Oaks, CA 91362"
  }, {
    name: "Newbury Park Martial Arts Center",
    keyword: "Martial Arts",
    type: ["Spiritual Growth", "Active Life"],
    location: "1111 Rancho Conejo Blvd Unit 503, Newbury Park, CA 91320"
  }, {
    name: "Boulderdash Indoor Rock Climbing",
    keyword: "Rock Climbing",
    type: ["Active Life"],
    location: "880 Hampshire Rd A, Westlake Village, CA 91361"
  }
];

//create dynamic variable for each place using Knockout
var Place = function(data) {
  this.name = ko.observable(data.name);
  this.type = ko.observableArray(data.type);
  this.location = ko.observable(data.location);
  this.keyword = ko.observable(data.keyword);
  //variable for wiki api call
  this.wikisearch = ko.observable("");
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
  this.filterList = ko.observableArray([]);
  //variable for user selected filter
  this.filter = ko.observable("");
  //iterate over data and add filters to list
  this.placesList().forEach( function(place) {
    place.type().forEach( function(type) {
      if (self.filterList().includes(type) != true) {
        self.filterList.push(type);
      };
    });
  });
  //filters locations based on user selection
  this.narrowList = function() {
    //remove places from toolbar
    self.placesList.removeAll();
    model.forEach( function(place) {
      if (place.type.includes(self.filter()) == true) {
        //modify map data
        clearMarkers();
        addMarker(place);
        //add filtered places to toolbar
        self.placesList.push(new Place(place));
      };
    });
  };
  //displays details of a particular place when clicked
  this.displaydetails = function(place) {
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
      }
    });
  };
 };

//link dynamic html bindings to javascript
ko.applyBindings(new ViewModel());

//clear markers from google
function clearMarkers() {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  };
  markers = [];
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
      markers.push(marker);
      var content = place.name + "<p>" + place.location + "<p>";
      //open info windor on map when marker is clicked
      marker.addListener('click', function() {
        toggleBounce();
        var infowindow = new google.maps.InfoWindow({
          content: content
        });
        infowindow.open(map, marker);
      });
      function toggleBounce() {
        if (marker.getAnimation() != null) {
          marker.setAnimation(null);
        } else {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        }
      }
      bounds.extend(results[0].geometry.location);
      map.fitBounds(bounds);
    //alert user a particular location does not exist
    } else {
      window.alert(place.name + "does not exist.");
    }
  });
};

//callback function to initialize google map api
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 34.1706, lng: -118.8376},
    zoom: 13
  });
  bounds = new google.maps.LatLngBounds();
  //use model data to populate markers and windows for map
  model.forEach( function(place) {
    addMarker(place);
  });
};
