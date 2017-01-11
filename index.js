const EventEmitter = require('events');

const MIN_FLOOR = 1;
const MAX_FLOOR = 10;

class ElevatorCar extends EventEmitter {
	constructor(floor) {
		super();

		this.floor = floor || 1;
		this.open = false;
		this.floorsPassed = 0;
		this.moving = false;
	}

	//go to the desired floor
	goToFloor(floor) {
		var instance = this;
		if (floor < MIN_FLOOR || floor > MAX_FLOOR) {
			return;
		}
		instance.moving = true;
		return new Promise(function(resolve, reject){
			while (instance.floor != floor) {
				if (instance.floor < floor) {
					instance.upFloor();
				} else if (instance.floor > floor) {
					instance.downFloor();
				}
			}
			instance.moving = false;
			resolve();
		});
	}

	//calculate the distance to the desired floor
	distanceToFloor(floor) {
		return Math.abs(this.floor - floor);
	}

	upFloor() {
		if (this.floor < MAX_FLOOR) {
			this.floor++;
			this.floorsPassed++;
			this.emit('floorChanged', {
				newFloor: this.floor
			});
		}
	}

	downFloor() {
		if (this.floor > MIN_FLOOR) {
			this.floor--;
			this.floorsPassed++;
			this.emit('floorChanged', {
				newFloor: this.floor
			});
		}
	}

	openDoor() {
		this.open = true;
		this.emit('doorOpened');
	}

	closeDoor() {
		this.open = false;
		this.emit('doorClosed');
	}
}

var carA = new ElevatorCar();

carA.on('floorChanged', function(event) {
	console.log('floorChanged:' + event.newFloor);
});

carA.goToFloor(10).then(function() {
	console.log('done');
});
