var playerRef, map, player, playerLabel, optionBar,
	equipmentScreen, skillsScreen, backpackScreen, settingsScreen,
	elements = [], entities = [], world = -1, playerAttackTimer;

// connection with top level Firebase
var ref = new Firebase("https://derrowaplegacy.firebaseio.com");

var weapons = {
	// Level: required to wield object
	// attack: average hit points for weapon
	// speed: interval weapon can be struck
	// style: style of combat used when using this weapon
	fist: {
		level: 0,
		attack: 1,
		speed: 10,
		style: 'melee'
	},
	stick: {
		level: 1,
		attack: 10,
		speed: 10,
		style: 'melee'
	},
	bow: {
		level: 1,
		attack: 10,
		speed: 10,
		style: 'range'
	},
	staff: {
		level: 1,
		attack: 10,
		speed: 10,
		style: 'magic'
	},
	knife: {
		level: 5,
		attack: 20,
		speed: 20,
		style: 'melee'
	},
	crossbow: {
		level: 5,
		attack: 20,
		speed: 20,
		style: 'range'
	},
	airstaff: {
		level: 5,
		attack: 20,
		speed: 20,
		style: 'magic'
	}
};

var armour = {
	// Level: required defense level to wield
	// Block: 0 - 100, percent blocking
	clothes: {
		level: 0,
		block: 0
	},
	leather: {
		level: 1,
		block: 10
	},
	chain: {
		level: 10,
		block: 20
	},
	steel: {
		level: 20,
		block: 30
	}
};

var enemies = {
	// Level: level of mob, not sure for functionality yet, maybe just tell player
	// health: max HP
	// attack: average damage dealt per hit
	// defense: 0 - 100, percent blocking
	// speed: speed of attacks
	// exp: experience gained to the player when this mob is killed
	rat: {
		name: 'rat',
		level: 0,
		health: 20,
		attack: 1,
		defense: 0,
		speed: 10,
		exp: 10
	},
	zombie: {
		name: 'zombie',
		level: 5,
		health: 100,
		attack: 10,
		defense: 10,
		speed: 10,
		exp: 50
	},
	troll: {
		name: 'troll',
		level: 10,
		health: 400,
		attack: 40,
		defense: 20,
		speed: 20,
		exp: 150
	}
};

window.onload = function() {
	startGame();
	console.log("game has been started");
};

// ============================================================================
// Firebase accounts
// ============================================================================

function signIn() {
	var username = $('#username').val();
	var email = $('#email').val();
	var password = $('#password').val();
	ref.authWithPassword({
		email: email,
		password: password
	}, function(error, authData) {
		if (error) {
			console.log("Login Failed!", error);
		} else {
			$('#sign-in').hide();
			console.log("Authenticated successfully with payload:", authData);
			playerRef = ref.child('users/' + username);
			loadPlayer();
			map.start();
		}
	});
}

function createAccount() {
	var username = $('#username').val();
	var email = $('#email').val();
	var password = $('#password').val();
	ref.createUser({
		email: email,
		password: password
	}, function(error, userData) {
		if (error) {
			console.log("Error creating user:", error);
		} else {
			$('#sign-in').hide();
			console.log("Successfully creater user account with uid:", userData.uid);
			initializePlayer(username);
			playerRef = ref.child('users/' + username);
			loadPlayer();
			map.start();
		}
	});
}

function deleteAccount() {
	var username = $('#username').val();
	var email = $('#email').val();
	var password = $('#password').val();
	ref.removeUser({
		email: email,
		password: password
	}, function(error) {
		if (error) {
			switch (error.code) {
				case "INVALID_USER":
					console.log("The specified user account does not exist.");
					break;
				case "INVALID_PASSWORD":
					console.log("The specified user account password is incorrect.");
					break;
				default:
					console.log("Error removeing user:", error);
			}
		} else {
			var onComplete = function(error) {
				if (error) {
					console.log("Could not remove user data:", error);
				} else {
					console.log("Removed all user data", username);
				}
			};
			var userRef = ref.child('users/' + username);
			userRef.remove(onComplete);
			console.log("User account deleted successfully!");
		}
	});
}

// ============================================================================
// Initial setup of game when logged in
// ============================================================================

function startGame() {
	map = {
		canvas: document.getElementById('canvas'),
		start: function() {
			this.context = this.canvas.getContext('2d');
			this.frameNo = 0;
			this.interval = setInterval(updateGameArea, 20);
			window.addEventListener('keydown', function(e) {
				map.keys = (map.keys || []);
				map.keys[e.keyCode] = (e.type == "keydown");
			});
			window.addEventListener('keyup', function(e) {
				map.keys[e.keyCode] = (e.type == "keydown");
			});
			this.canvas.addEventListener('click', function(event) {
				var x = event.pageX - 3; //TODO: is there padding to replace 0?
				var y = event.pageY - 3;

				elements.forEach(function(element) {
					if (y > element.top 
						&& y < element.top + element.height
						&& x > element.left
						&& x < element.left + element.width) {
						handleCollision(element.name);
					}
				});
				for (i = 0; i < entities.length; i++) {
					element = entities[i];
					if (y > element.top
						&& y < element.top + element.height
						&& x > element.left
						&& x < element.left + element.width) {
						attackedEnemy(i);
					}
				}
			});
		},
		stop: function() {
			clearInterval(this.interval);
		},
		clear: function() {
			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		}
	};
	optionBar = {
		leftX: map.canvas.width - 203,
		leftY: map.canvas.height - 53,
		update: function() {
			ctx = map.context;

			// start outside border
			ctx.beginPath();
			ctx.moveTo(this.leftX, this.leftY);
			ctx.lineTo(this.leftX + 200, this.leftY);
			ctx.moveTo(this.leftX, this.leftY + 50);
			ctx.lineTo(this.leftX + 200, this.leftY + 50);

			// start inner borders
			for (x = this.leftX; x <= this.leftX + 200; x += 50) {
				ctx.moveTo(x, this.leftY);
				ctx.lineTo(x, this.leftY + 50);
			}

			// complete shape
			ctx.closePath();
			ctx.lineWidth = 3;
			ctx.strokeStyle = 'red';
			ctx.stroke();
		}
	};
	
	elements.push({
		name: 'equipment-option',
		width: 50,
		height: 50,
		top: optionBar.leftY,
		left: optionBar.leftX
	});
	elements.push({
		name: 'skills-option',
		width: 50,
		height: 50,
		top: optionBar.leftY,
		left: optionBar.leftX + 50
	});
	elements.push({
		name: 'backpack-option',
		width: 50,
		height: 50,
		top: optionBar.leftY,
		left: optionBar.leftX + 100
	});
	elements.push({
		name: 'settings-option',
		width: 50,
		height: 50,
		top: optionBar.leftY,
		left: optionBar.leftX + 150
	});
}



function loadPlayer() {
	playerRef.once("value", function(snapshot) {
		data = snapshot.val();
		player = {
			name: data.name,
			health: data.health,
			money: data.money,
			melee: data.skills.melee,
			range: data.skills.range,
			magic: data.skills.magic,
			defense: data.skills.defense,
			farming: data.skills.farming,
			fishing: data.skills.fishing,
			thieving: data.skills.thieving,
			inventory: data.inventory,
			weapon: data.weapon,
			armour: data.armour,
			updateVal: function(type, value) {
				switch (type) {
					case 'health':
						playerRef.update({ health: value });
						break;
					case 'money':
						playerRef.update({ money: value });
						break;
					case 'melee':
						playerRef.update({ melee: value });
						break;
					case 'range':
						playerRef.update({ range: value });
						break;
					case 'magic':
						playerRef.update({ magic: value });
						break;
					case 'defense':
						playerRef.update({ defense: value });
						break;
					case 'farming':
						playerRef.update({ farming: value });
						break;
					case 'fishing':
						playerRef.update({ fishing: value });
						break;
					case 'thieving':
						playerRef.update({ thieving: value });
						break;
					case 'inventory':
						playerRef.update({ inventory: value });
						break;
					case 'weapon':
						playerRef.update({ weapon: value });
						break;
					case 'armour':
						playerRef.update({ armour: value });
						break;
					default:
						console.log("Invalid param to update player: ", type);
				}
			}
		};
		playerLabel = {
			name: player.name,
			style: player.weapon.style,
			level: getLevel(player[weapons[player.weapon].style]),
			maxHealth: Math.floor(
				((getLevel(player.melee) + getLevel(player.range) + getLevel(player.magic)) / 3) + getLevel(player.defense)) * 100,
			health: player.health,
			update: function() {
				this.style = weapons[player.weapon].style.capitalizeFirstLetter();
				this.level = getLevel(player[this.style]);
				this.maxHealth = Math.floor(
					((getLevel(player.melee) + getLevel(player.range) + getLevel(player.magic)) / 3) + getLevel(player.defense)) * 100;
				this.health = player.health;

				ctx = map.context;
				ctx.font = "15px Consolas";
				ctx.textAlign = "left";
				ctx.fillText(this.name, 10, 10);
				ctx.fillText(this.style + ":", 10, 25);
				ctx.fillText(" Level " + this.level, 60, 25);
				ctx.fillText("HP " + this.health + "/" + this.maxHealth, 10, 40);
				ctx.fillStyle = "#FFFFFF";
				ctx.fillRect(100, 28, 100, 15);
				ctx.fillStyle = "#FF0000";
				ctx.fillRect(100, 28, (this.health / this.maxHealth) * 100, 15);
			}
		};
	});
}

function initializePlayer(username) {
	var userRef = ref.child('users/' + username);
	userRef.set({
		'name': username,
		'health': 40,
		'money': 0,
		'skills': { // each value is their exp
			//TODO: create level system (what xp ranges are what levels?)
			'melee': 0,
			'range': 0,
			'magic': 0,
			'defense': 0,
			'farming': 0,
			'fishing': 0,
			'thieving': 0
		},
		'inventory': {}, // TODO: initialize with something?
		'weapon': 'fist',
		'armour': 'clothes'
	});
}

// ============================================================================
// Options bar on bottom right of canvas
// ============================================================================

equipmentScreen = {
	update: function() {
		if (equipmentOpen) {
			var ctx = map.context;

			// Draw box
			ctx.fillStyle = "#bf8040";
			ctx.fillRect(optionBar.leftX-1, optionBar.leftY-400, 202, 400);

			// Text settings
			ctx.font = "20px Consolas";
			ctx.textAlign = "left";
			ctx.fillStyle = "blue";

			// Draw top label
			ctx.fillText("Equipment", optionBar.leftX, optionBar.leftY-380);

			// Draw content
			ctx.fillText("Weapon: " + player.weapon, optionBar.leftX, optionBar.leftY - 300);
			ctx.fillText("Armour: " + player.armour, optionBar.leftX, optionBar.leftY - 200);
			ctx.fillText("Combat Style:", optionBar.leftX, optionBar.leftY - 100);
			ctx.fillText(weapons[player.weapon].style, optionBar.leftX + 50, optionBar.leftY - 75);

			console.log("Opened equipment screen");
		}
	}
};
skillsScreen = {
	update: function() {
		if (skillsOpen) {
			var ctx = map.context;

			// Draw box
			ctx.fillStyle = "#bf8040";
			ctx.fillRect(optionBar.leftX-1, optionBar.leftY-400, 202, 400);

			// Text settings
			ctx.font = "15px Consolas";
			ctx.textAlign="center";
			ctx.fillStyle = "blue";

			// Draw top labels
			ctx.fillText("Skill", optionBar.leftX+35, optionBar.leftY-380);
			ctx.fillText("Level", optionBar.leftX+90, optionBar.leftY-380);
			ctx.fillText("Experience", optionBar.leftX+155, optionBar.leftY-380);

			// Draw Melee skill
			ctx.fillText("Melee", optionBar.leftX+35, optionBar.leftY-360);
			ctx.fillText("" + getLevel(player.melee), optionBar.leftX+90, optionBar.leftY-360);
			ctx.fillText("" + player.melee + "/" + getNextLevelExp(player.melee), optionBar.leftX+155, optionBar.leftY-360);

			// Draw Range skill
			ctx.fillText("Range", optionBar.leftX+35, optionBar.leftY-340);
			ctx.fillText("" + getLevel(player.range), optionBar.leftX+90, optionBar.leftY-340);
			ctx.fillText("" + player.range + "/" + getNextLevelExp(player.range), optionBar.leftX+155, optionBar.leftY-340);

			// Draw Magic skill
			ctx.fillText("Magic", optionBar.leftX+35, optionBar.leftY-320);
			ctx.fillText("" + getLevel(player.magic), optionBar.leftX+90, optionBar.leftY-320);
			ctx.fillText("" + player.magic + "/" + getNextLevelExp(player.magic), optionBar.leftX+155, optionBar.leftY-320);

			// Draw Defense skill
			ctx.fillText("Defense", optionBar.leftX+35, optionBar.leftY-300);
			ctx.fillText("" + getLevel(player.defense), optionBar.leftX+90, optionBar.leftY-300);
			ctx.fillText("" + player.defense + "/" + getNextLevelExp(player.defense), optionBar.leftX+155, optionBar.leftY-300);

			// Draw Farming skill
			ctx.fillText("Farming", optionBar.leftX+35, optionBar.leftY-280);
			ctx.fillText("" + getLevel(player.farming), optionBar.leftX+90, optionBar.leftY-280);
			ctx.fillText("" + player.farming + "/" + getNextLevelExp(player.farming), optionBar.leftX+155, optionBar.leftY-280);

			// Draw Fishing skill
			ctx.fillText("Fishing", optionBar.leftX+35, optionBar.leftY-260);
			ctx.fillText("" + getLevel(player.fishing), optionBar.leftX+90, optionBar.leftY-260);
			ctx.fillText("" + player.fishing + "/" + getNextLevelExp(player.fishing), optionBar.leftX+155, optionBar.leftY-260);

			// Draw Thieving skill
			ctx.fillText("Thieving", optionBar.leftX+35, optionBar.leftY-240);
			ctx.fillText("" + getLevel(player.thieving), optionBar.leftX+90, optionBar.leftY-240);
			ctx.fillText("" + player.thieving + "/" + getNextLevelExp(player.thieving), optionBar.leftX+155, optionBar.leftY-240);


			console.log("Opened skills screen");
		}
	}
};
backpackScreen = {
	update: function() {
		if (backpackOpen) {
			var ctx = map.context;

			// Draw box
			ctx.fillStyle = "#bf8040";
			ctx.fillRect(optionBar.leftX-1, optionBar.leftY-400, 202, 400);

			// Text settings
			ctx.font = "20px Consolas";
			ctx.textAlign = "center";
			ctx.fillStyle = "blue";

			// Draw top label
			ctx.fillText("Backpack", optionBar.leftX+100, optionBar.leftY-380);

			// Fill in items


			console.log("Opened backpack screen");
		}
	}
};
settingsScreen = {
	update: function() {
		if (settingsOpen) {
			var ctx = map.context;

			// Draw box
			ctx.fillStyle = "#bf8040";
			ctx.fillRect(optionBar.leftX-1, optionBar.leftY-400, 202, 400);

			// Text settings
			ctx.font = "20px Consolas";
			ctx.fillStyle = "blue";

			// Draw top label
			ctx.fillText("Settings", optionBar.leftX+100, optionBar.leftY-380);

			// Draw content


			console.log("Opened settings screen");
		}
	}
};

// ============================================================================
// Handling for ALL images in game
// ============================================================================

// initialize images
var shield = new Image();
var skills = new Image();
var backpack = new Image();
var gear = new Image();

// load images here so there aren't loaded on every update
shield.src = "./resources/shield.png";
skills.src = "./resources/skills.png";
backpack.src = "./resources/inventory.png";
gear.src = "./resources/settings.png";

function loadImages() {
	ctx = map.context;

	// draw images on canvas
	ctx.drawImage(shield, optionBar.leftX, optionBar.leftY, 50, 50);
	ctx.drawImage(skills, optionBar.leftX + 50, optionBar.leftY, 50, 50);
	ctx.drawImage(backpack, optionBar.leftX + 100, optionBar.leftY, 50, 50);
	ctx.drawImage(gear, optionBar.leftX + 150, optionBar.leftY, 50, 50);
}

// ============================================================================
// Actions for clicking
// ============================================================================

var equipmentOpen = false;
var skillsOpen = false;
var backpackOpen = false;
var settingsOpen = false;

function handleCollision(name) {
	switch(name) {
		case 'equipment-option':
			console.log("Pressed equipment-option box");
			if (equipmentOpen) {
				equipmentOpen = false;
			} else {
				equipmentOpen = true;
				skillsOpen = false;
				backpackOpen = false;
				settingsOpen = false;
			}
			break;
		case 'skills-option':
			console.log("Pressed skills-option box");
			if (skillsOpen) {
				skillsOpen = false;
			} else {
				equipmentOpen = false;
				skillsOpen = true;
				backpackOpen = false;
				settingsOpen = false;
			}
			break;
		case 'backpack-option':
			console.log("Pressed backpack-option box");
			if (backpackOpen) {
				backpackOpen = false;
			} else {
				equipmentOpen = false;
				skillsOpen = false;
				backpackOpen = true;
				settingsOpen = false;
			}
			break;
		case 'settings-option':
			console.log("Pressed settings-option box");
			if (settingsOpen) {
				settingsOpen = false;
			} else {
				equipmentOpen = false;
				skillsOpen = false;
				backpackOpen = false;
				settingsOpen = true;
			}
			break;
		default:
			console.log("Pressed unknown element: " + name);
	}
}

function attackedEnemy(index) {
	if (playerAttackTimer !== 0) {
		return;
	}
	attacked = entities[index];
	playerWeapon = weapons[player.weapon];
	attacked.health -= Math.floor(playerWeapon.attack * (attacked.defense / 100));
	if (attacked.health <= 0) {
		// enemy died
		player[weapon[player.weapon].style] += enemies[attacked.name].exp;
		entities = [];
	}

}

// ============================================================================
// Helper functions
// ============================================================================

String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

var MAX_LEVEL = 10;
var levels = [0];
var expCounter = 100;
for (i = 1; i <= MAX_LEVEL; i++) {
	levels.push(levels[i-1] + expCounter);
	expCounter += 100;
}

function getLevel(exp) {
	for (i = 1; i <= MAX_LEVEL; i++) {
		if (exp < levels[i]) {
			return i;
		}
	}
	return MAX_LEVEL;
}

function getNextLevelExp(exp) {
	for (i = 1; i <= MAX_LEVEL; i++) {
		if (exp < levels[i]) {
			return levels[i];
		}
	}
	return exp;
}

function drawMobs(entityList) {
	var ctx = map.context;

	// common context settings
	ctx.font = "15px Consolas";
	ctx.textAlign="center";

	for (i = 0; i < entityList.length; i++) {
		entity = entityList[i];

		// Draw mob
		ctx.fillStyle = "red";
		ctx.fillRect(entity.left, entity.top, entity.width, entity.height);

		// Draw HP and Mob label
		ctx.fillStyle = "white";
		ctx.fillText("HP:" + entity.health + "/" + entity.enemy.health, entity.left + Math.floor(entity.width / 2), entity.top-15);
		ctx.fillText(entity.enemy.name + " LVL " + entity.enemy.level, entity.left + Math.floor(entity.width / 2), entity.top+Math.floor(entity.height / 2));
	}
}

function updateGameArea() {
	// clear screen
	map.clear();

	// Handle components updating once logged in
	if (playerLabel !== null) {
		playerLabel.update();
		optionBar.update();
		loadImages();
		equipmentScreen.update();
		skillsScreen.update();
		backpackScreen.update();
		settingsScreen.update();
	}

	// Handle key pressed
	if (map.keys) {
		if (map.keys[49]) {
			world = 0;
			worldStates[world].start();
		} else if (map.keys[50]) {
			world = 1;
			worldStates[world].start();
		}
	}

	// Handle which world to update
	if (world !== -1) {
		worldStates[world].update();
	}
}

// ============================================================================
// World States
// ============================================================================

worldStates = [
	{
		// Train Rat
		mob: enemies.rat,
		start: function() {
			// define all entities in current state that can be clicked
			entities = [
				{
					enemy: this.mob,
					color: 'red',
					health: this.mob.health,
					attackTime: 0,
					width: 50,
					height: 50,
					top: 200,
					left: 300
				}
			];
		},
		update: function() {
			drawMobs(entities);
		}
	}, {
		// Train Zombie
		mob: enemies.zombie,
		start: function() {
			// define all entities in current state that can be clicked
			entities = [
				{
					enemy: this.mob,
					color: 'blue',
					health: this.mob.health,
					attackTime: 0,
					width: 100,
					height: 100,
					top: 200,
					left: 200
				}
			];
		},
		update: function() {
			drawMobs(entities);
		}
	}
];