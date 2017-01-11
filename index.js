const EventEmitter = require('events');
const prompt = require('prompt');

const MIN_FLOOR = 1;
const MAX_FLOOR = 10;
const SERVICE_AFTER = 100;

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
		this.beingServiced = false;
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
			if (instance.tripsMade >= 100) {
				instance.beingServiced = true;
			}
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
			var shortestDistance = MAX_FLOOR;

			//check if a car is already at the floor.
			var targetCar = instance.cars.filter(
				function(car) {
					return car.floor === currentFloor;
				}
			);

			if (targetCar.length) {

				resolve(targetcar);
			}

			//if there is no car at this floor, find one closest or on it's way past
			for (var i in instance.cars) {
				var car = instance.cars[i];
				if (car.beingServiced) {
					continue;
				}
				if ((currentFloor < car.floor && car.direction === 'down') ||
					(currentFloor > car.floor && car.direction === 'up')) {
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
				targetCar.promise.then(function() {
					targetCar.openDoor();
					resolve(targetCar);
				});
			}

			targetCar.goToFloor(currentFloor).then(function() {
				targetCar.openDoor();
				resolve(targetCar);
			});
		});
	}
}

var operator = new ElevatorCarOperator();

function awaitUser() {
	prompt.start();
	console.log('Please enter your current floor and destination floor.');
	prompt.get(['currentFloor', 'destinationFloor'], function(err, result) {
		operator.callCar(result.currentFloor).then(function(car) {
			console.log("Your car is here! Its' name is " + car.name + ".  Now going to your destination floor.");
			car.goToFloor(result.destinationFloor).then(function(car) {
				console.log('You have arrived at floor ' + car.floor + '.');
			});
		}).then(awaitUser);
	});
};

awaitUser();
