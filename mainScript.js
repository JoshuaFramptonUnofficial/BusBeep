// I have documented the following code to help whoever is reading this understand my thought process

let marker; // selected place marker
let userLocationMarker; // user location marker
let infoWindow; // pop-up box above marker
let circle; // circle around location
let map; // gmp-map ref
let watchId = null; // id from navigator.geolocation.watchPosition to stop tracking
let selectedPlace = null; // object holding location info

// the location rows in grid
let location1;
let location2;
let location3;
let location4;
let location5;
let coords1;
let coords2;
let coords3;
let coords4;
let coords5;

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function calculateDistance(latitude1, longitude1, latitude2, longitude2) { 
    const earthRadius = 6371000; // earth's radius in meters
    const phi1 = toRadians(latitude1);
    const phi2 = toRadians(latitude2);
    const changePhi = toRadians(latitude2 - latitude1);
    const changeLambda = toRadians(longitude2 - longitude1);

    const a = Math.sin(changePhi / 2) * Math.sin(changePhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(changeLambda / 2) * Math.sin(changeLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadius * c; // distance in meters
    if (distance > 6371000) {
        console.log("Error present with location converter");
    }
    return distance;
}

function triggerAlert() {
    let alertSound = new Audio('audio.mp3');
    alertSound.play();
}

function getLocation() { 
    // Check if the browser supports geolocation
    if (navigator.geolocation) {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId); // clear existing watch
        }
        watchId = navigator.geolocation.watchPosition(showPosition, showError, {
            enableHighAccuracy: true, 
            maximumAge: 2000, 
            timeout: 5000 // balance between accuracy and performance
        });
    } else {
        document.getElementById("setLocation").innerHTML = 
          "Your browser doesn't support location tracking, please use a location-enabled browser";
    }
}

function showPosition(position) {
    const radiusInput = document.getElementById("radius-input");
    const alertRadius = parseInt(radiusInput.value);
    const currentCoords = { 
        lat: position.coords.latitude, 
        lng: position.coords.longitude
    };

    // Create or update user location marker
    if (!userLocationMarker) {
        userLocationMarker = createMarker(currentCoords, 'FORWARD_CLOSED_ARROW', 'blue', 4);
    } else { 
        userLocationMarker.setPosition(currentCoords);
    }
    
    const infoContent = `
        <div>
            <strong>Current Location</strong><br>
            Lat: ${currentCoords.lat.toFixed(6)}<br>
            Lng: ${currentCoords.lng.toFixed(6)}
        </div>
    `;
    infoWindow.setContent(infoContent);
    infoWindow.open(map.innerMap, userLocationMarker);

    console.log("User location updated to:", currentCoords);

    if (selectedPlace) {
        const distance = calculateDistance(currentCoords.lat, currentCoords.lng, selectedPlace.lat, selectedPlace.lng);
        console.log("Distance to location:", distance, "meters");
        if (distance <= alertRadius) {
            triggerAlert();
        }
    }
}

function createMarker(coords, symbol, color, size) {
    return new google.maps.Marker({
        map: map.innerMap,
        position: coords,
        icon: {
            path: google.maps.SymbolPath[symbol],
            fillColor: color,
            fillOpacity: 1,
            strokeColor: "white",
            strokeWeight: 2,
            scale: size
        }
    });
}

function showError(error) {
    let errorMessage = " ";
    switch (error.code) {
        case error.PERMISSION_DENIED: 
            errorMessage = "Location access denied.";
            break;
        case error.POSITION_UNAVAILABLE:
            errorMessage = "Your location is unavailable.";
            break;
        case error.TIMEOUT: 
            errorMessage = "Location request timed out.";
            break;
        default:
            errorMessage = "Error getting location.";
    }
    document.getElementById("setLocation").innerHTML = errorMessage;
}

async function startup() {
    await customElements.whenDefined('gmp-map'); // ensures map element is defined
    map = document.querySelector("gmp-map");
    const placePicker = document.getElementById("place-picker");
    infoWindow = new google.maps.InfoWindow();

    // Update the location IDs
    coords1 = document.getElementById("coords1");
    coords2 = document.getElementById("coords2");
    coords3 = document.getElementById("coords3");
    coords4 = document.getElementById("coords4");
    coords5 = document.getElementById("coords5");

    location1 = document.getElementById("location1");
    location2 = document.getElementById("location2");
    location3 = document.getElementById("location3");
    location4 = document.getElementById("location4");
    location5 = document.getElementById("location5");

    // Place Picker Event Listener
    placePicker.addEventListener('gmpx-placechange', function () {
        const place = placePicker.value;
        console.log("Selected place object:", place);
        if (!place || !place.location) {
            window.alert("No details available for input:" + place.name);
            infoWindow.close();
            if (marker) marker.setPosition(null);
            if (circle) circle.setMap(null);
            return;
        }

        // When a place is selected from the search, show its info window.
        map.center = place.location;
        if (marker == null || marker == undefined) {
            marker = createMarker(place.location, 'CIRCLE', 'red', 7);
        } else {
            marker.setPosition(place.location);
        }
        
        const addressParts = place.formattedAddress.split(', ');
        const shortAddress = addressParts.length > 2 ? `${addressParts[1]}, ${addressParts[2]}` : place.formattedAddress;
        infoWindow.setContent(`<div><strong>${place.displayName}</strong><br>${shortAddress}</div>`);
        infoWindow.open(map.innerMap, marker);
        map.innerMap.setZoom(20);

        selectedPlace = {
            name: place.displayName,
            address: place.formattedAddress,
            lat: place.location.lat(),
            lng: place.location.lng(),
        };

        const radiusInput = document.getElementById("radius-input");
        const radiusValue = parseInt(radiusInput.value);
        console.log("Radius input:", radiusInput.value, "Parsed radius:", radiusValue);

        if (circle) {
            circle.setMap(null);
        }
        circle = new google.maps.Circle({
            map: null, // do not display circle immediately for favorites
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
    const favouriteLocationBtn = document.getElementById("save");
    const uploadFavouritesBtn = document.getElementById("upload");
    const saveFavouriteBtn = document.getElementById("fav");
    const selectBtn1 = document.getElementById("selected1");
    const selectBtn2 = document.getElementById("selected2");
    const selectBtn3 = document.getElementById("selected3");
    const selectBtn4 = document.getElementById("selected4");
    const selectBtn5 = document.getElementById("selected5");

    uploadFavouritesBtn.addEventListener('click', () => {});
    saveFavouriteBtn.addEventListener('click', () => {});

    setLocationBtn.addEventListener('click', () => {
        if (watchId !== null) { // if location tracking is active, stop it
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
            if (circle) {
                circle.setMap(null);
            }
        } else { // create a circle based on the selected favorite
            if (selectedPlace) {
                const radiusInput = document.getElementById("radius-input");
                const radiusValue = parseInt(radiusInput.value);
                const newRadius = isNaN(radiusValue) ? 100 : radiusValue;
                
                // Always remove any existing circle before creating a new one
                if (circle) {
                    circle.setMap(null);
                }
                circle = new google.maps.Circle({
                    map: map.innerMap,
                    radius: newRadius,
                    fillColor: '#FF0000',
                    fillOpacity: 0.35,
                    strokeColor: '#FFFFFF',
                    strokeOpacity: 0.6,
                    strokeWeight: 2,
                    center: { lat: selectedPlace.lat, lng: selectedPlace.lng }
                });
                console.log("Created circle with radius:", newRadius);
                alert(`Your location has been set to '${selectedPlace.name}'.`);
            }
            getLocation();
        }
    });

    favouriteLocationBtn.addEventListener("click", () => {
        if (location1.innerText.trim() === "") {
            location1.innerHTML = selectedPlace.name;
            coords1.innerHTML = selectedPlace.lat + "," + selectedPlace.lng;
            console.log("Saved location:", location1.innerText);
        } else if (location2.innerText.trim() === "") {
            location2.innerHTML = selectedPlace.name;
            coords2.innerHTML = selectedPlace.lat + "," + selectedPlace.lng;
            console.log("Saved location:", location2.innerText);
        } else if (location3.innerText.trim() === "") {
            location3.innerHTML = selectedPlace.name;
            coords3.innerHTML = selectedPlace.lat + "," + selectedPlace.lng;
            console.log("Saved location:", location3.innerText);
        } else if (location4.innerText.trim() === "") {
            location4.innerHTML = selectedPlace.name;
            coords4.innerHTML = selectedPlace.lat + "," + selectedPlace.lng;
            console.log("Saved location:", location4.innerText);
        } else if (location5.innerText.trim() === "") {
            location5.innerHTML = selectedPlace.name;
            coords5.innerHTML = selectedPlace.lat + "," + selectedPlace.lng;
            console.log("Saved location:", location5.innerText);
        } else {
            alert("Location saves are full! Please refresh and start a new save or upload a different one with spare.");
        }
    });

    
    function handleFavoriteSelection(favName, coordsField) {
        const coordsValue = coordsField.textContent.trim();
        const [lat, lng] = coordsValue.split(",").map(Number);
        if (isNaN(lat) || isNaN(lng)) {
            console.error("Invalid coordinates in", coordsField.id);
            return;
        }
        const latLng = new google.maps.LatLng(lat, lng);

        // Close any open info window
        if (infoWindow) {
            infoWindow.close();
        }

        // Remove existing circle and marker
        if (circle) {
            circle.setMap(null);
            circle = null;
        }
        if (marker) {
            marker.setMap(null);
            marker = null;
        }

        // Place a red marker at the favorite location
        marker = createMarker(latLng, 'CIRCLE', 'red', 7);
        map.innerMap.setCenter(latLng);

        // Update the selectedPlace object
        selectedPlace = {
            name: favName,
            lat: lat,
            lng: lng
        };
    }

    selectBtn1.addEventListener("click", () => {
        handleFavoriteSelection("Favourite 1", coords1);
    });
    selectBtn2.addEventListener("click", () => {
        handleFavoriteSelection("Favourite 2", coords2);
    });
    selectBtn3.addEventListener("click", () => {
        handleFavoriteSelection("Favourite 3", coords3);
    });
    selectBtn4.addEventListener("click", () => {
        handleFavoriteSelection("Favourite 4", coords4);
    });
    selectBtn5.addEventListener("click", () => {
        handleFavoriteSelection("Favourite 5", coords5);
    });
}

document.addEventListener('DOMContentLoaded', startup);
