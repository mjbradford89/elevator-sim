const EventEmitter = require('events');
const Prompt = require('prompt');

const MIN_FLOOR = 1;
const MAX_FLOOR = 10;

class ElevatorCar extends EventEmitter {
	constructor(floor, carName) {
		super();

		if (floor < MIN_FLOOR || floor > MAX_FLOOR) {
			floor = null;
		}

		this.name = carName;
		this.floor = floor || 1;
		this.open = false;
		this.floorsPassed = 0;
		this.tripsMade = 0;
		this.moving = false;
	}

	//go to the desired floor
	//returns a promise that is resolved when destination is reached
	goToFloor(floor) {
		var instance = this;
		if (floor < MIN_FLOOR || floor > MAX_FLOOR) {
			return;
		}
		instance.moving = true;
		instance.direction = floor < instance.floor ? 'down' : 'up';
		instance.promise = new Promise(function(resolve, reject){
			while (instance.floor != floor) {
				if (instance.floor < floor) {
					instance.upFloor();
				} else if (instance.floor > floor) {
					instance.downFloor();
				}
			}
			instance.moving = false;
			instance.direction = null;
			instance.tripsMade++;
			instance.emit('tripMade', {
				tripsMade: instance.tripsMade
			});
			resolve();
		});
		return instance.promise;
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

class ElevatorCarOperator {
	constructor() {
		this.cars = [/*new ElevatorCar(1, 'Andy'), new ElevatorCar(5, 'Woody'),*/ new ElevatorCar(1000, 'Buzz')];
	}

	callCar(currentFloor) {
		var shortestDistance = MAX_FLOOR,
			targetCar = this.cars[0];

		for (var i in this.cars) {
			var car = this.cars[i];
			if ((currentFloor < car.floor && car.direction === 'down') ||
				(currentFloor > car.floor && car.direction === 'up') ||
				(car.floor === currentFloor)) {
				if (car.moving) {
					console.log('found moving car');
				}
				if (car.floor === currentFloor) {
					console.log('found same floor');
				}
				targetCar = car;
				break;
			}
			var distanceToFloor = car.distanceToFloor(currentFloor);
			if (distanceToFloor < shortestDistance) {
				shortestDistance = car.distanceToFloor(currentFloor);
				targetCar = car;
			}
		}

		if (targetCar.moving) {
			console.log(targetCar.name + " is already on its' way to get you!");
			return targetCar.promise.then(function() {
				console.log(targetCar.name + " is here to pick you up!");
			});
		}

		return targetCar.goToFloor(currentFloor).then(function() {
			console.log(targetCar.name + " is here to pick you up!");
		});
	}
}

var operator = new ElevatorCarOperator();

operator.callCar(2);
operator.callCar(1);
