const coordinatesOverlay = document.getElementById("coordinates-overlay");

const ui = {
	updateCoordinates(myPosition) {
		coordinatesOverlay.innerText = `(${myPosition.x}, ${myPosition.y}, ${myPosition.z})`;
	},
};

export default ui;
