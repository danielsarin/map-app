$(document).ready(function() {
   
   $(document).on("click", "#searchButton", function() {
        var keyword = $("#searchField").val();
        
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
        
        $.ajax({ url: "http://data.aalto.fi/sparql?query="+encodedQuery+"&output=json",
			cache: false,
			dataType: 'jsonp',
			success: function(data) {
				$("#myPlaces").hide();
				$("#searchResults").show();
				$("#searchResults").html("");
				
				var bindings = data.results.bindings;
				for (i in bindings) {
					var item = '<li><a href="#map" data-lat="'+bindings[i].lat.value+'" data-long="'+bindings[i].long.value+'">'+bindings[i].name.value+'</a></li>';
					$("#searchResults").append(item);
				}
				
			}
        });    
    });
    
    
    $(document).on("click", "#searchResults a", function() {
    
    	var mapOptions = {
			zoom: 12,
			center: new google.maps.LatLng(this.getAttribute("data-lat"), this.getAttribute("data-long")),
			mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
        google.maps.event.trigger(map, 'resize');
    });
    
    
});
