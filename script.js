$(document).ready(function() {

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
        var item = '<li><a href="#map" data-lat="'+bindings1[i].lat.value+'" data-long="'+bindings1[i].long.value+'"><h2>'+bindings1[i].name.value+'</h2><p>'+bindings1[i].label.value+'</p></a></li>';
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
        var item = '<li><a href="#map" data-lat="'+bindings2[i].lat.value+'" data-long="'+bindings2[i].long.value+'"><h2>'+bindings2[i].code.value+' '+bindings2[i].courseTitle.value+'</h2><p>'+bindings2[i].label.value+'</p></a></li>';
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
        var item = '<li><a href="#map" data-lat="'+bindings3[i].lat.value+'" data-long="'+bindings3[i].long.value+'"><h2>'+bindings3[i].buildingname.value+', '+bindings3[i].label.value+'</h2><p>'+bindings3[i].address.value+'</p></a></li>';
        $('#searchResults').append(item);
      }
      
      $('#searchResults').listview('refresh');
      $.mobile.loading('hide');
      
      // if there are no results
      if ($('#searchResults').is(':empty')) {
        $('#noResults').html('<p><em>No results</em></p>');
      }
    });    
  });
  
  
  
  
  /* Add place marker on map when a link is clicked */
  $(document).on('click', '#searchResults a, #placesList a', function() {
      var lat = $(this).attr('data-lat');
      var long = $(this).attr('data-long');
      
      removeMarkers();
      var marker = new google.maps.Marker({
          map: map,
          position: new google.maps.LatLng(lat, long),
          title: $(this).text()
      });
      markersArray.push(marker);
      currentPosition = marker.getPosition();
      
      var directionsAnchor = '<a id="directionsLink" href="#">Get directions</a>';
      google.maps.event.addListener(marker, 'click', function() {
          var infoWindow = new google.maps.InfoWindow({content: directionsAnchor});
          infoWindow.open(map, this);
      });
  	
  });
  
  
  $(document).on('click', '#directionsLink', function() {
      if ('geolocation' in navigator) {
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
  
  
});
