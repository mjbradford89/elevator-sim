const EventEmitter = require('events');
const prompt = require('prompt');

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
		instance.closeDoor();
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
			resolve(instance);
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
		this.cars = [new ElevatorCar(1, 'Andy'), new ElevatorCar(5, 'Woody'), new ElevatorCar(10, 'Buzz')];
	}

	callCar(currentFloor) {
		var instance = this;
		return new Promise(function(resolve, reject) {
			var shortestDistance = MAX_FLOOR,
				targetCar = instance.cars[0];

			for (var i in instance.cars) {
				var car = instance.cars[i];
				if ((currentFloor < car.floor && car.direction === 'down') ||
					(currentFloor > car.floor && car.direction === 'up') ||
					(car.floor === currentFloor)) {
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
				targetCar.promise.then(function() {
					console.log(targetCar.name + " is here to pick you up!");
					targetCar.openDoor();
					resolve(targetCar);
				});
			}

			targetCar.goToFloor(currentFloor).then(function() {
				console.log(targetCar.name + " is here to pick you up!");
				targetCar.openDoor();
				resolve(targetCar);
			});
		});
	}
}

var operator = new ElevatorCarOperator();

function awaitUser() {
	prompt.start();
	prompt.get(['currentFloor', 'destinationFloor'], function(err, result) {
		operator.callCar(result.currentFloor).then(function(car) {
			car.goToFloor(result.destinationFloor).then(function(car) {
				console.log('You have arrived at floor ' + car.floor + '.');
			});
		}).then(awaitUser);
	});
};

awaitUser();
