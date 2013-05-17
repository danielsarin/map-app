$(document).ready(function() {
  
  /* Fetch saved places from local storage */
  if (typeof(Storage) !== 'undefined') {
    // count = number of places stored
    // places = the stored places
    if (localStorage.count) {
      if (localStorage.places) {
        var jsonObj = JSON.parse(localStorage.places);
        for (var i = 0; i < Number(localStorage.count); i++) {
          var cur = JSON.parse(jsonObj[i]);
          var item = '<li><a href="#map" data-lat="'+cur.lat+'" data-long="'+cur.long+'" data-type="'+cur.type+'"><h2>'+cur.title+'</h2><p class="ui-li-aside"><button id="removePlace" data-inline="true" data-icon="delete" data-iconpos="notext" data-id="'+i+'"></button></p></a></li>';
          $('#myPlaces').append(item);
        }
        $('#myPlaces').listview('refresh');
        $('#home').trigger('create'); // refresh jQM controls
        if (i > 0) {
          $('#noPlaces').hide();
        }
      }
    } else {
      localStorage.count = 0;
    }
  }
  
  /* Initialize map */
  var currentPosition = new google.maps.LatLng(60.18711,24.83192);
  
  var directionsDisplay = new google.maps.DirectionsRenderer();
  var directionsService = new google.maps.DirectionsService();
  var mapOptions = {
    zoom: 15,
    center: currentPosition,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
  directionsDisplay.setMap(map);
  
  var markersArray = []; // store all map markers here
  
  var curLoc = null; // Current user-entered location
  var curLocInfoOn = null; 
  var curLocInfoOff = null;
  var curLocInfoWindow = null;
  
  /******
     * Listener for setting your current location (marker) on the map by clicking.
     * Keeps track of one current location, adding and removing listeners each time
     * the location is changed with another click.
     */
  google.maps.event.addListener(map, 'click', function(event) {
	  var marker = new google.maps.Marker({
              map: map,
              position: event.latLng,
              title: 'You are here.',
	  });

	  if (curLoc != null) {
	      removeCurLoc();
	  } 
	
	      
	  curLoc = marker; // Overwrites any previously set location
	
	  var infoText = 'You are here. Click to remove.';
	
	  curLocRemoval = google.maps.event.addListener(marker, 'click', function() {
	      removeCurLoc();
	  });

	  curLocInfoOn = google.maps.event.addListener(marker, 'mouseover', function() {
	      curLocInfoWindow = new google.maps.InfoWindow({content: infoText});
	      curLocInfoWindow.open(map, this);
	  });
	  curLocInfoOff = google.maps.event.addListener(marker, 'mouseout', function() {
	      curLocInfoWindow.close();
	  });
  });
  
  
  // Function for clearing the current location listeners and the current location marker
  function removeCurLoc() {
	  google.maps.event.removeListener(curLocInfoOn);
	  google.maps.event.removeListener(curLocInfoOff);
	  google.maps.event.removeListener(curLocRemoval);
	  curLoc.setMap(null);
  }
  
  // function for removing markers
  function removeMarkers() {
    if (markersArray) {
      for (var i = 0; i < markersArray.length; i++ ) {
        markersArray[i].setMap(null);
      }
      markersArray.length = 0;
    }
  }
  
  // resize the map when the map page is shown
  $('#map').on('pageshow', function() {
    google.maps.event.trigger(map, 'resize');
    map.setCenter(currentPosition);
  });
  
  
  
  /* Execute a sparql query and show the results in a list */
  $(document).on('click', '#searchButton', function() {
    var keyword = $('#searchField').val();
    
    if (keyword == '') {
      return;
    }
    
    /* Search people */
    var sparqlQuery = 'prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>  \
    prefix geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> \
    prefix foaf: <http://xmlns.com/foaf/0.1/> \
    prefix db:<http://dbpedia.org/ontology/> \
    prefix tisc:<http://observedchange.com/tisc/ns#> \
    SELECT DISTINCT ?name ?label ?address ?lat ?long WHERE{ \
        ?person a foaf:Person; \
            foaf:name ?name; \
            foaf:firstName ?firstName; \
            foaf:familyName ?familyName . \
        {?person foaf:name ?name FILTER regex(?name, "'+keyword+'", "i")} \
        UNION {?person foaf:firstName ?firstName FILTER regex(?firstName, "'+keyword+'", "i")} \
        UNION {?person foaf:familyName ?familyName FILTER regex(?familyName, "'+keyword+'", "i")}. \
        ?peopleorganization foaf:member ?person . \
        ?peopleorganization rdfs:label ?label . \
        ?buildingorg rdfs:label ?label2 . \
        FILTER(str(?label)=str(?label2)) \
        ?buildingorg tisc:locatedAt ?building . \
        ?building db:address ?address . \
        ?building geo:lat ?lat . \
        ?building geo:long ?long . \
    } \
    GROUP BY ?name ?label ?address ?lat ?long';
    
    var encodedQuery = encodeURIComponent(sparqlQuery);
    
    
    
    /* Search courses */
    var sparqlQuery2 = 'prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> \
    prefix geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> \
    prefix foaf: <http://xmlns.com/foaf/0.1/> \
    prefix db:<http://dbpedia.org/ontology/> \
    prefix tisc:<http://observedchange.com/tisc/ns#> \
    prefix aiiso:<http://purl.org/vocab/aiiso/schema#> \
    prefix teach:<http://linkedscience.org/teach/ns#> \
    SELECT DISTINCT ?code ?courseTitle ?label ?address ?lat ?long WHERE{ \
    ?course a aiiso:Course; \
    aiiso:code ?code; \
    teach:courseTitle ?courseTitle . \
    {?course aiiso:code ?code FILTER regex(?code, "'+keyword+'", "i")} \
    UNION {?course teach:courseTitle ?courseTitle FILTER regex(?courseTitle, "'+keyword+'", "i")} . \
    ?courseorganization aiiso:teaches ?course . \
    ?courseorganization foaf:name ?label . \
    ?buildingorg rdfs:label ?label2 . \
    FILTER(str(?label)=str(?label2)) \
    ?buildingorg tisc:locatedAt ?building . \
    ?building db:address ?address . \
    ?building geo:lat ?lat . \
    ?building geo:long ?long \
    } \
    GROUP BY ?code ?courseTitle ?label ?address ?lat ?long';
    
    var encodedQuery2 = encodeURIComponent(sparqlQuery2);

    
    
    /* Search departments and buildings */
    var sparqlQuery3 = 'prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> \
    prefix geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> \
    prefix db:<http://dbpedia.org/ontology/> \
    prefix tisc:<http://observedchange.com/tisc/ns#> \
    prefix aiiso:<http://purl.org/vocab/aiiso/schema#> \
    SELECT DISTINCT ?label ?buildingname ?address ?lat ?long \
    WHERE{ \
    ?department a aiiso:Department; \
    rdfs:label ?label; \
    tisc:locatedAt ?building . \
    ?building db:address ?address; \
    rdfs:label ?buildingname; \
    geo:lat ?lat; \
    geo:long ?long . \
    {?department rdfs:label ?label FILTER regex(?label, "'+keyword+'", "i")} \
    UNION {?building rdfs:label ?buildingname FILTER regex(?buildingname, "'+keyword+'", "i")} \
    } \
    GROUP BY ?label ?buildingname ?address ?lat ?long \
    ORDER BY ?label';
    
    var encodedQuery3 = encodeURIComponent(sparqlQuery3);
    
    
    
    
    $.mobile.loading('show'); // show loading icon
    $.when( $.ajax({ url: 'http://data.aalto.fi/sparql?query='+encodedQuery+'&output=json',
              cache: false, dataType: 'jsonp' }),
            $.ajax({ url: 'http://data.aalto.fi/sparql?query='+encodedQuery2+'&output=json',
              cache: false, dataType: 'jsonp' }),
            $.ajax({ url: 'http://data.aalto.fi/sparql?query='+encodedQuery3+'&output=json',
              cache: false, dataType: 'jsonp' })
            ).then(function(results1, results2, results3) {
      $('#myPlaces').hide();
      $('#noPlaces').hide();
      $('#searchResults').show();
      $('#searchResults, #noResults').html('');
      
      // people
      var data1 = results1[0];
      var bindings1 = data1.results.bindings;
      if (!($.isEmptyObject(bindings1))) {
        var item = '<li data-role="list-divider">People</li>';
        $('#searchResults').append(item);
      }
      for (i in bindings1) {
        var item = '<li><a href="#map" data-lat="'+bindings1[i].lat.value+'" data-long="'+bindings1[i].long.value+'" data-type="person"><h2>'+bindings1[i].name.value+'</h2><p>'+bindings1[i].label.value+'</p><p class="ui-li-aside"><button id="addPlace" data-inline="true" data-icon="plus" data-iconpos="notext"></button></p></a></li>';
        $('#searchResults').append(item);
      }
      
      // courses
      var data2 = results2[0];
      var bindings2 = data2.results.bindings;
      if (!($.isEmptyObject(bindings2))) {
        var item = '<li data-role="list-divider">Courses</li>';
        $('#searchResults').append(item);
      }
      for (i in bindings2) {
        var item = '<li><a href="#map" data-lat="'+bindings2[i].lat.value+'" data-long="'+bindings2[i].long.value+'" data-type="course"><h2>'+bindings2[i].code.value+' '+bindings2[i].courseTitle.value+'</h2><p>'+bindings2[i].label.value+'</p><p class="ui-li-aside"><button id="addPlace" data-inline="true" data-icon="plus" data-iconpos="notext"></button></p></a></li>';
        $('#searchResults').append(item);
      }
      
      // departments and buildings
      var data3 = results3[0];
      var bindings3 = data3.results.bindings;
      if (!($.isEmptyObject(bindings3))) {
        var item = '<li data-role="list-divider">Departments and buildings</li>';
        $('#searchResults').append(item);
      }
      for (i in bindings3) {
        var item = '<li><a href="#map" data-lat="'+bindings3[i].lat.value+'" data-long="'+bindings3[i].long.value+'" data-type="dep"><h2>'+bindings3[i].buildingname.value+', '+bindings3[i].label.value+'</h2><p>'+bindings3[i].address.value+'</p><p class="ui-li-aside"><button id="addPlace" data-inline="true" data-icon="plus" data-iconpos="notext"></button></p></a></li>';
        $('#searchResults').append(item);
      }
      
      $('#searchResults').listview('refresh');
      $('#home').trigger('create'); // refresh jQM controls
      $.mobile.loading('hide');
      
      // if there are no results
      if ($('#searchResults').is(':empty')) {
        $('#noResults').html('<p><em>No results</em></p>');
      }
    });    
  });
  
  
  
  /* Hide search results and show my places when clear button is clicked */
  $(document).on('click', '.ui-input-clear', function() {
    $('#searchResults').html('');
    $('#myPlaces').show();
    if (Number(localStorage.count) == 0) {
        $('#noPlaces').show();
    }
  });
  
  
  /* Add place to my places */
  $(document).on('click', '#addPlace', function() {
    if (typeof(Storage) !== 'undefined') {
      var newObj = { 'lat': $(this).closest('a').attr('data-lat'), 
            'long': $(this).closest('a').attr('data-long'),
            'type': $(this).closest('a').attr('data-type'),
            'title': $(this).closest('a').children('h2')[0].innerHTML };
      var jsonObj;
      if (localStorage.places) {
        jsonObj = JSON.parse(localStorage.places);
        
      } else {
        jsonObj = JSON.parse('{}');
      }
      jsonObj[localStorage.count] = JSON.stringify(newObj);
      jsonString = JSON.stringify(jsonObj);
      localStorage.places = jsonString;
      
      var cur = JSON.parse(jsonObj[Number(localStorage.count)]);
      var item = '<li><a href="#map" data-lat="'+cur.lat+'" data-long="'+cur.long+'" data-type="dep"><h2>'+cur.title+'</h2><p class="ui-li-aside"><button id="removePlace" data-inline="true" data-icon="delete" data-iconpos="notext"></button></p></a></li>';
      $('#myPlaces').append(item);
      
      $('#myPlaces').listview('refresh');
      $('#home').trigger('create'); // refresh jQM controls
      
      $('#noPlaces').hide();
      
      localStorage.count = Number(localStorage.count) + 1;
    } else {
      alert("Local storage is not supported.");
    }
    return false;
  });
  
  
  /* Remove place from my places */
  $(document).on('click', '#removePlace', function() {
    if (typeof(Storage) !== 'undefined') {
      if (localStorage.places && Number(localStorage.count) > 0) {
        jsonObj = JSON.parse(localStorage.places);
        delete jsonObj[$(this).attr('data-id')];
        jsonString = JSON.stringify(jsonObj);
        localStorage.places = jsonString;
        $(this).closest('li').remove();
        
        $('#myPlaces').listview('refresh');
        $('#home').trigger('create'); // refresh jQM controls
        
        localStorage.count = Number(localStorage.count) - 1;
        
        if (Number(localStorage.count) == 0) {
          $('#noPlaces').show();
        }
      }
    } else {
      alert("Local storage is not supported.");
    }
    return false;
  });
  
  
  
  
  /* Add place marker on map when a link is clicked */
  $(document).on('click', '#searchResults a, #myPlaces a, #restaurants a', function() {
      var lat = $(this).attr('data-lat');
      var long = $(this).attr('data-long');
      
      var type = $(this).attr('data-type');
      if (!type) {
        type = 'marker';
      }
      
      removeMarkers();
      var marker = new google.maps.Marker({
        map: map,
        position: new google.maps.LatLng(lat, long),
        title: $(this).text(),
        icon: 'images/' + type + '.png',
        shadow: 'images/' + type + '_shadow.png'
      });
      markersArray.push(marker);
      currentPosition = marker.getPosition();
      
      var title = '<p>'+$(this).closest('a').children('h2')[0].innerHTML+'</p>';
      var directionsAnchor = '<a id="directionsLink" href="#">Show the path here</a>';
      google.maps.event.addListener(marker, 'click', function() {
        var infoWindow = new google.maps.InfoWindow({content: title+ directionsAnchor});
        infoWindow.open(map, this);
      });
  	
  });
  
  
  /* Get directions from current location to target */
  $(document).on('click', '#directionsLink', function() {
      if (curLoc != null && curLoc.getMap() != null) {
	      var start = curLoc.getPosition();
	      var end = markersArray[0].getPosition();
	      var request = {
          origin: start,
          destination: end,
          travelMode: google.maps.TravelMode.WALKING
	      };
	      directionsService.route(request, function(result, status) {
          if (status == google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(result);
          }
	      });

	    } else if ('geolocation' in navigator) {
        $.mobile.loading('show');
        navigator.geolocation.getCurrentPosition(function(position) {
          var start = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
          var end = markersArray[0].getPosition();
          var request = {
            origin: start,
            destination: end,
            travelMode: google.maps.TravelMode.WALKING
          };
          directionsService.route(request, function(result, status) {
            if (status == google.maps.DirectionsStatus.OK) {
              directionsDisplay.setDirections(result);
            }
          });
          $.mobile.loading('hide');
        });
      } else {
          alert("I'm sorry, but geolocation services are not supported by your browser.");
      }

  });
  
  
  /* TODO: Fetch Aalto events */
  $(document).on('click', '#fetchAaltoEvents', function() {
    alert('Not implemented.');
  });
  
  
});
