//I have documented the following code to help whoever is reading this my thought process and to help them understand how it all works

let marker; // selected place
let userLocationMarker; // user location
let infowindow; // pop-up box above market
let circle; // radius around location
let map; //gmp-map ref
let watchId = null; // an id returned by navigator.Geolocation.watchPosition to let the program stop watching when button pressed again
let selectedPlace = null; // object holding location info


function toRadians(degrees)
{
    let rads = degrees*(Math.PI / 180);
    return rads;
}

function calculateDistance(latitude1,longitude1,latitude2,longitude2)
{ 
    const earthRadius = 6371000; //earths radius in meters
    const phi1 = toRadians(latitude1);
    const phi2 = toRadians(latitude2);
    const changePhi = toRadians(latitude2 - latitude1);
    const changeLambda = toRadians(longitude2 - longitude1);

    let partA = Math.sin(changePhi/2) * Math.sin(changePhi / 2)
    let partB = partA + Math.cos(phi1) * Math.cos(phi2) * Math.sin(changeLambda /2) * Math.sin(changeLambda / 2);
    let partC = 2 * Math.atan2(Math.sqrt(partB), Math.sqrt(1 - partB));
    let distance = earthRadius * partC; //distance in meters
    if(distance>6371000)
    {
        console.log("Error present with location converter"); //used to tell if all conversion was working fine
    }
    return distance;
}
function triggerAlert()
{
    let alertSound = new Audio('audio.mp3');
    alertSound.play();
}
function getLocation() { 
    
    //checks if the users browser supports geolocation (glorified gps detector)
    if (navigator.geolocation) 
    {
        
        if (watchId !== null)
        {
            navigator.geolocation.clearWatch(watchId); //clears watch ID 
        }
        watchId = navigator.geolocation.watchPosition(showPosition, showError, 
        {
            enableHighAccuracy: true, 
            maximumAge: 2000, 
            timeout: 5000 // after experimenting with different timeout values, i find that 5000 ms is the best balance between accuracy and performance/data usage.
        });
    }
    else 
    {
        document.getElementById("setLocation").innerHTML = "Your browser doesn't support location tracking, please use a location enabled browser";
		//error message so people know why their tracking isnt working
    }
}

function showPosition(position) {
    const radiusInput = document.getElementById("radius-input");
    const alertRadius = parseInt(radiusInput.value);
    let distance=0;

    const currentCoords = 
    { 
        lat: position.coords.latitude, 
        lng: position.coords.longitude
    };
    // create or update user location marker
    if (!userLocationMarker) 
    {
        userLocationMarker = createMarker(currentCoords, 'FORWARD_CLOSED_ARROW', 'blue', 4)
    } else { 
        userLocationMarker.setPosition(currentCoords);
    }
    
    const infoContent = 
    `
        <div>
            <strong>Current Location</strong><br>
            Lat: ${currentCoords.lat.toFixed(6)}<br>
            Lng: ${currentCoords.lng.toFixed(6)}
        </div> 
    `;// at first, the info content was imediately displayed, but then i changed it to save the content to a variable before displaying it for flexibility and allowing it to be easilly editted in the future
    infowindow.setContent(infoContent);
    infowindow.open(map.innerMap, userLocationMarker);

    console.log("User location updated to:", currentCoords);

    if(selectedPlace)
    {
        console.log("Current Coordinates:", currentCoords.lat, currentCoords.lng);
        console.log("Selected Place Coordinates:", selectedPlace.lat, selectedPlace.lng);
        distance = calculateDistance(currentCoords.lat,currentCoords.lng,selectedPlace.lat,selectedPlace.lng);
        console.log("Distance to location:",distance, "meters")
        if(distance<= alertRadius)
            {
                triggerAlert();
            }
    }
}
function createMarker(coords, sort, colour, size) {
    return new google.maps.Marker({ //this api system is depreciated by google, but will still work long after i submit my NEA
        map: map.innerMap,
        position: coords,
        icon: {
            path: google.maps.SymbolPath[sort], //at first i was using thise code exclusively for the user location marker, then i repurposed it to be used system-wide
            fillColor: colour,
            fillOpacity: 1,
            strokeColor: "white",
            strokeWeight: 2,
            scale: size
        }
    });
}

function showError(error) { //this subroutine handles errors, modified version of w3schools example
    let errorMessage = " ";
    switch (error.code) {
        case error.PERMISSION_DENIED: 
            errorMessage = "Location access denied.";
            break;
        case error.POSITION_UNAVAILABLE:
            errorMessage = "Your Location is unavailable.";
            break;
        case error.TIMEOUT: 
            errorMessage = "Location request timed out.";
            break;
        default:
            errorMessage = "Error getting location.";
    }
    document.getElementById("setLocation").innerHTML=errorMessage;
}

async function startup() { //this subroutine happens at the start to initialise the main stuff
    await customElements.whenDefined('gmp-map'); //helps stop issue where map dosent show up properly
    map = document.querySelector("gmp-map");
    const placePicker = document.getElementById("place-picker");
    infowindow = new google.maps.InfoWindow(); //initialising info window earlier on, keeps code simpler

    // Place Picker Event Listener
    placePicker.addEventListener('gmpx-placechange', function ()
	{
        const place = placePicker.value;


        if (!place.location) {
            window.alert("No details available for input: '" + place.name + "'");
            infowindow.close();
            marker.position = null;
            if (circle) circle.setMap(null);
            return;
        }

        map.center = place.location;
        if(marker == null || marker == undefined)
        {
            marker = createMarker(place.location, 'CIRCLE', 'red', 7)
        }
        else 
        {
            marker.setPosition(place.location)
        }
        
        //turns location into readbale adress for info box
        const addressParts = place.formattedAddress.split(', ');
        const shortAddress = addressParts.length > 2 ? `${addressParts[1]}, ${addressParts[2]}` : place.formattedAddress;
        infowindow.setContent(`<div><strong>${place.displayName}</strong><br>${shortAddress}</div>`);
        infowindow.open(map.innerMap, marker);
        map.innerMap.setZoom(20);

        selectedPlace = {
            name: place.displayName,
            address: place.formattedAddress,
            lat: place.location.lat(),
            lng: place.location.lng(),
        };

        const radiusInput = document.getElementById("radius-input");
        const radiusValue = parseInt(radiusInput.value); //I struggled initially with the circle not updating since i accidentally used an un-defined variable. I then realised i needed to use radiusValue consistently
        console.log("Your radius input value:", radiusInput.value); 
        console.log("The parsed radius value:", radiusValue); 

        if (circle) 
		{
            circle.setMap(null);
        }
        circle = new google.maps.Circle({
            map: null,
            radius: radiusValue,
            fillColor: '#32CD32',
            fillOpacity: 0.25,
            strokeColor: '#FFFFFF',
            strokeOpacity: 0.6,
            strokeWeight: 4,
            center: place.location
        });
    });

    const setLocationBtn = document.getElementById("setLocation");

    setLocationBtn.addEventListener('click', () => {
        if (watchId !== null) { //if location being tracked
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
            setLocationText.style.display = "inline";
            locationTrackingButtonText.style.display = "none";

            //if (userLocationMarker) userLocationMarker.setMap(null);  //this was creating an issue where when i set another location, my original marker would disapear
            if (circle) 
            {
                circle.setMap(null);
            }
        } else { //if location not being tracked
            if (selectedPlace) 
            {

                const radiusInput = document.getElementById("radius-input");
                const radiusValue = parseInt(radiusInput.value);
                const newRadius = isNaN(radiusValue) ? 100 : radiusValue;
                
                if (circle) 
                {
                    circle.setRadius(newRadius);
                    circle.setMap(map.innerMap);
                } 
                else 
                {
                    circle = new google.maps.Circle(
                    {
                        map: map.innerMap,
                        radius: newRadius,
                        fillColor: '#FF0000',
                        fillOpacity: 0.35,
                        strokeColor: '#FFFFFF',
                        strokeOpacity: 0.6,
                        strokeWeight: 2,
                        center: { lat: selectedPlace.lat, lng: selectedPlace.lng }
                    });
                }
                console.log("Updated Circle Radius:", newRadius);
                alert(`Your location has been set to '${selectedPlace.name}'.`);
            }

            getLocation();
        }
        // At the end of the place picker event listener:
    });

    //bellow is the maths required to calculate distance

    
}

document.addEventListener('DOMContentLoaded', startup);
