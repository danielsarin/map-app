$(document).ready(function() {

    /* Initialize map */
    var otaniemi = new google.maps.LatLng(60.18711,24.83192);
    var mapOptions = {
	    zoom: 15,
	    center: otaniemi,
	    mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    var markers = []; // store all map markers here
    
    // function for removing markers
    function removeMarkers() {
        for (var i = 0; i < markers.length; i++ ) {
            markers[i].setMap(null);
        }
    }
    
    // resize the map when the map page is shown
    $("#map").on("pageshow", function() {
        google.maps.event.trigger(map, 'resize');
        map.setCenter(otaniemi);
    });
    
    
    
    /* Execute a sparql query and show the results in a list */
    $(document).on("click", "#searchButton", function() {
        var keyword = $("#searchField").val();
        
        if (keyword == "") {
            return;
        }
        
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
        
        $.mobile.loading('show');
        $.ajax({ url: "http://data.aalto.fi/sparql?query="+encodedQuery+"&output=json",
			cache: false,
			dataType: 'jsonp',
			success: function(data) {
				$("#myPlaces").hide();
				$("#searchResults").show();
				$("#searchResults").html("");
				
				var bindings = data.results.bindings;
				for (i in bindings) {
					var item = '<li><a href="#map" data-lat="'+bindings[i].lat.value+'" data-long="'+bindings[i].long.value+'"><h2>'+bindings[i].name.value+'</h2><p>'+bindings[i].address.value+'</p></a></li>';
					$("#searchResults").append(item);
				}
				$("#searchResults").listview('refresh');
				
			},
			complete: function() {
			    $.mobile.loading('hide');
			}
        });    
    });
    
    
    /* Add place marker on map when a link is clicked */
    $(document).on("click", "#searchResults a, #placesList a", function() {
        var lat = $(this).attr("data-lat");
        var long = $(this).attr("data-long");
        
        removeMarkers();
        var marker = new google.maps.Marker({
            map: map,
            position: new google.maps.LatLng(lat, long),
            title: $(this).text()
        });
        markers.push(marker);
    	
    });
    
    
});
