var app = angular.module('myApp');

app.controller("jobListCtrl", function($http, $scope, inputFactory, diceFactory) {
   $scope.searchObject = inputFactory.returnObject();
   console.log($scope.searchObject);

   diceFactory.post($scope.searchObject, (response)=>{
    console.log(response);
    $scope.items = response.result.resultItemList;
    $scope.searchObject = response.body;
    doTheMap();
  });

   function initMap(){
    console.log("init Map starts");
   $scope.globalMap = new google.maps.Map(document.getElementById('job-map'), {
       center: {
           lat: 42.2814,
           lng: -83.7483
       },
       scrollwheel: true,
       zoom: 10
       });
    }

    //The Dice API returns an array (currently)called $scope.items
    //First, I need to find the address and use it for the center
    //Also use the address for the center of the PlacesServices if provided
    //otherwise, use the zipcode for the center of PS
    //


    $scope.searchCenter = chooseCenterParam();
    $scope.detailedMapsInfo = [];



    function chooseCenterParam(){
        //only uses the street address as the center if it was provided
        console.log("chooseCenterParam starts");
        if ($scope.searchObject.street_address !== undefined){
            return $scope.searchObject.street_address + " " + $scope.searchObject.city;
        }
        return $scope.searchObject.city;
    }


    function getCenter() {
        console.log("get center starts");
        //takes user input and centers the map on the selected location
        chooseCenterParam();
        $scope.geocoder = new google.maps.Geocoder();
        $scope.geocoder.geocode({
            address: $scope.searchCenter,
            componentRestrictions: {
                country: 'US',
                postalCode: $scope.searchObject.city
            }
        }, function(results, status) {
          console.log("get center callback starts");
            if (status == 'OK') {
                $scope.globalMap.setCenter(results[0].geometry.location);
                $scope.locationsRequest.location = results[0].geometry.location;
                $scope.locationsRequest.x = (Math.cos((Math.PI/180) * $scope.locationsRequest.location.lat())*69.172);
                console.log($scope.locationsRequest.x);
                console.log("latlng literal from Get Center: "+$scope.locationsRequest.location);
                $scope.locationsRequest.radius = 4000;
                getLocations();
            }
        });
    }
    //funtion containing conditional logic comparing each result to the user input rad property if within limit add marker to page.
    //itemLat && itemLon = business result place

    //iLat && iLon = location of user input
    //if (itemLat <= centerLat + rad && iLat >= centerLat - rad && iLon <= centerLon + rad && iLon> centLon - rad) {}

    //Length of 1 degree of Longitude = cosine (latitude) * length of degree (miles) at equator

    //length of 1° of latitude = 1° * 69.172 miles = 69.172 miles

    // scope.locationsRequest.location  (this is the user input center)
    // 1st calculate the actual length of of lat long here
    // 2nd then apply that calculation to translate to a radius to conditionally check each result to the defined radius
    //then place

    function checkRad(place, loc) {
      var rad = 0;
      var iLat = place.geometry.location.lat();
      var iLon = place.geometry.location.lon();
      var centerLat = loc.location.lat();
      var centerLon = loc.location.lon();
      console.log(iLat + centerLat);
      if (iLat <= centerLat + rad && iLat >= centerLat - rad && iLon <= centerLon + rad && iLon > centLon - rad) {
        return true;
      } else {
        return false;
      }
    }

    function addMarker(place, loc){
      console.log("addMarker starts");
      console.log(place.geometry.location.lat());
        if (checkRad(place, loc)) {
          var marker = new google.maps.Marker({
              map: $scope.globalMap,
              position: place.geometry.location,
              icon: {
                  url: 'http://maps.gstatic.com/mapfiles/circle.png',
                  anchor: new google.maps.Point(10, 10),
                  scaledSize: new google.maps.Size(10, 17)
              }
          });
          marker.addListener('click', function(){
            console.log('You Clicked Me! Yay!!!!');
            console.log("location: " + loc.location);
            $scope.$apply(function() {
              $scope.modalInfo = loc.jobTitle + " " + loc.company + " " + loc.location;
              $scope.modalLink = loc.detailUrl;
              $scope.modalJob = loc.jobTitle;
              $scope.modalCompany = loc.company;
              $scope.modalLocation = loc.location;
            });
            $scope.$apply(function() {});
            // var stuffInModal = angular.element(document.querySelector('#modal'));
            // stuffInModal.append($scope.modalInfo);
            console.log($scope.modalInfo);
            //save job title, company name, and link.
            //save address
          });
        }
    }

    $scope.locationsRequest = {
        query: location.company,
        location: $scope.latlng,
        radius: 4000,
    }; //passes information generated by the APIs from user's search parameters to getLocations function

    //******CHANGED THE NAME OF THIS FUNCTION FROM getLocations******
    function getLocs() {
      console.log("get locations starts");
      // var i = 0;
      var thisId={};
      var interval = 500;
        $scope.service = new google.maps.places.PlacesService($scope.globalMap);
        //for each item returned by the DICE API...
            var thisThingThatIsNotAnotherThing = function(location){
              console.log("the one with a ridiculous name starts");
              console.log('Hello');

                //setting query to values from our input
                $scope.locationsRequest.query = location.company + " " +location.location;
                //below: passes the $scope.locationsRequest object as the search parameters

                //*******makes request to places********
                $scope.service.textSearch($scope.locationsRequest, function(results, status){
                  console.log("text search status: " + status);
                  if (status == google.maps.places.PlacesServiceStatus.OK) {
                   thisId = results[0].place_id
                  }
                });
                console.log("thisId: " + thisId);
                        //********Make another request to places********
                $scope.service.getDetails({placeId: thisId}, function(place, status){
                    if (status ==  google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT){
                      interval += 20;
                      console.log('interval: ' + interval);
                      console.log('over_Query_LImit in getDetails.')
                    }
                    else if (status == google.maps.places.PlacesServiceStatus.OK || status == google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                        console.log(i);
                        i++;
                        $scope.detailedMapsInfo.push(place);
                        console.log("place: " + place.geometry.location);
                        addMarker(place, location);
                    }
                });
            }
              var i = 0;
          var testInterval = setInterval(function nextOne() {

            console.log("next one is called!");
            if( i < $scope.items.length) {
              setTimeout(()=> {
              console.log("next one if statement, i="+i);
              thisThingThatIsNotAnotherThing($scope.items[i]);
              console.log(interval);
            }, interval);
            } else {clearInterval(testInterval);}
          }, interval);

      };
    //THIS IS THE EXPERIMENTAL GETLOCATIONS FUNCTION
    var interval
    function getLocations(){
      console.log("results from Dice:"); console.log($scope.items);
      $scope.service = new google.maps.places.PlacesService($scope.globalMap);
      console.log("latlng literal from getLocations: "+$scope.locationsRequest.location);

      //for(var i=0; i <= $scope.items.length; i++){
      //$scope.items.forEach(function(location){
        (function(){
          console.log("for reference, $scope.items.length = " +$scope.items.length);
          var counter = 0;
          setInterval(function(){
            if (counter >= $scope.items.length){
              return
            };
            console.log("counter: " + counter)
            console.log($scope.items[counter]);
            doTheThing($scope.items[counter]);

            counter++;
          },210)

            clearInterval(interval);


        })();
        //setTimeout( function() {
          //for(var j = 0; j < 9; j++) {

          //};
        //}, 1000)


      //}//end forloop
    }//end GetLocations experimental

    function doTheThing(loc){
      $scope.service.nearbySearch({
          key: 'AIzaSyCj2K40lPL72J1ageAAVTTMH2w4N78Df74',
          //keyword: location.company,
          location: $scope.locationsRequest.location,
          radius: 10000,
          name: loc.company + " " + loc.location
        }, function(results, status){
          console.log("nearbySearch results callback status for"+loc.company+" "+ loc.location+": " + status);
          if(status == "OK") {
            console.log("results: "); console.log(results[0]);
            var place = results[0];
            addMarker(place, loc);
          }
        });
        //console.log("address search for geocoder is:" + location.company + " " + location.location);
        // $scope.geocoder.geocode({
        //   address: location.company + " " + location.location
        //   //bounds: LatLngBounds,
        // }, function(results, status){
        //   console.log("geocoder results callback status: " + status);
        //   console.log("results: "); console.log(results[0]);
        //   var place = results[0];
        //   addMarker(place);
        // });//end .geocode
      }//end doTheThing

    function doTheMap(){
      console.log("dotheMap starts");
        initMap();
        getCenter();

    }

});


// app.controller('searchOutputCtrl', function($scope, inputFactory) {

// });
