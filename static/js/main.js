class Laser extends Phaser.Physics.Arcade.Sprite
{
	constructor(scene, x, y) {
		super(scene, x, y, 'laser');
	}

	fire(x, y) {
		this.body.reset(x, y);

		this.setActive(true);
		this.setVisible(true);

		this.setVelocityY(-900);
	}

	preUpdate(time, delta) {
		super.preUpdate(time, delta);
 
		if (this.y <= 0) {
			this.setActive(false);
			this.setVisible(false);
		}
	}

}

var scoreText;
var path;
var turrets;
var enemies;
var myship;
var bullets;
var shape;
var life = 500;
var max = 1;
var score = 0;
var temposcore = 0;
var destroyscore = 0;
var deltagame = 0;

class LaserGroup extends Phaser.Physics.Arcade.Group
{
	constructor(scene) {
		super(scene.physics.world, scene);

		this.createMultiple({
			frameQuantity: 20,
			key: 'laser',
			active: false,
			visible: false,
			classType: Laser
		});
	}
	
	fireBullet(x, y) {
		const laser = this.getFirstDead(false);

		if(laser) {
			laser.fire(x, y);
		}
	}
}

function getEnemy(x, y, distance) {
    var enemyUnits = myship;
         
        if(enemyUnits.active && Phaser.Math.Distance.Between(x, y, enemyUnits.x, enemyUnits.y) < distance)
            return enemyUnits;
    
    return false;
} 


var Turret = new Phaser.Class({

        Extends: Phaser.GameObjects.Image,

        initialize:

        function Turret (scene)
        {
            Phaser.GameObjects.Image.call(this, scene, 0, 0, 'sprites', 'turret');
            this.nextTic = 0;
			this.speed = Phaser.Math.GetSpeed(600, 3);
			
			this.lifespan = 1000;
        },
        place: function(i, j) {            
            this.y = j ;
            this.x = i ;
			this.depth = 10;
			this.hp = 100;
			//this.setVelocityY(200);
                        
        },
		receiveDamage: function(damage) {
            this.hp -= damage;           
            //console.log(this.hp);
            // if hp drops below 0 we deactivate this enemy
            if(this.hp <= 0) {
                this.setActive(false);
                this.setVisible(false);  
				destroyscore += 20;    
            }
        },
        fire: function() {
            var enemy = getEnemy(this.x, this.y, 600);
            if(enemy) {
                var angle = Phaser.Math.Angle.Between(this.x, this.y, enemy.x, enemy.y);
                addBullet(this.x, this.y, angle);
                this.angle = (angle + Math.PI/2) * Phaser.Math.RAD_TO_DEG;
            }
        },
        update: function (time, delta)
        {
			//this.x += this.dx * (this.speed * delta);
            this.y +=  (this.speed * delta);
			if(this.y>600){
				this.setActive(false);
                this.setVisible(false);
			}
            if(time > this.nextTic) {
                this.fire();
                this.nextTic = time + 1000;
				//this.x += this.dx * (this.speed * delta);
            	//this.y += this.dy * (this.speed * delta);
            }

        }
});
    
var Bullet = new Phaser.Class({

        Extends: Phaser.GameObjects.Image,

        initialize:

        function Bullet (scene)
        {
            Phaser.GameObjects.Image.call(this, scene, 0, 0, 'bullet');

            this.incX = 0;
            this.incY = 0;
            this.lifespan = 0;

            this.speed = Phaser.Math.GetSpeed(500, 1);
        },
		
        fire: function (x, y, angle)
        {
            this.setActive(true);
            this.setVisible(true);
            //  Bullets fire from the middle of the screen to the given x/y
            this.setPosition(x, y);
            
        //  we don't need to rotate the bullets as they are round
        //    this.setRotation(angle);

            this.dx = Math.cos(angle);
            this.dy = Math.sin(angle);

            this.lifespan = 1000;
        },

        update: function (time, delta)
        {
            this.lifespan -= delta;

            this.x += this.dx * (this.speed * delta);
            this.y += this.dy * (this.speed * delta);

            if (this.lifespan <= 0)
            {
                this.setActive(false);
                this.setVisible(false);
            }
        }

    });

class SpaceScene extends Phaser.Scene
{
	constructor() {
		super('init');

		this.ship;
		this.laserGroup;
		this.inputKeys;
		this.shoot;
	}

	preload() {
		this.load.image('laser', '/static/img/assets/laserBlue02.png');
		this.load.image('ship', '/static/img/assets/playerShip1_red.png');
		this.load.json('playership1_red-shape', '/static/img/assets/playership1_red-shape.json');
		this.load.image('muro', '/static/img/assets/muro.png');
		this.load.atlas('sprites', '/static/img/assets/spritesheet.png', '/static/img/assets/spritesheet.json');
    	this.load.image('bullet', '/static/img/assets/bullet.png');
	}

	create() {
		this.cameras.main.setBackgroundColor(0x1D1923);
		shape = this.cache.json.get('playership1_red-shape');;
		this.laserGroup = new LaserGroup(this);
		scoreText = this.add.text(10,10,score).setFontSize(50);
		this.shoot = false;
		this.addShip();
		this.addEvents();
		turrets = this.physics.add.group({ classType: Turret, runChildUpdate: true });
    
    	bullets = this.physics.add.group({ classType: Bullet, runChildUpdate: true });
		this.physics.add.overlap(this.ship, bullets, this.damageShip, null, this);
		this.nuevaColumna();
	}

	addShip() {
		const centerX = this.cameras.main.width / 2;
		const bottom = this.cameras.main.height;
		this.ship = this.physics.add.image(centerX, bottom - 90, 'ship');
		myship = this.ship;
		life = 500;
		score = 0;
		destroyscore = 0;
		deltagame = 0;
	}

	addEvents() {

		// Moving the mouse should move the ship
		this.input.on('pointermove', (pointer) => {
			this.ship.x = pointer.x;
			this.ship.y = pointer.y;
		});

		// Clicking the mouse should fire a bullet
		this.input.on('pointerdown', (pointer) => {
			//this.fireBullet();
			this.shoot = true;
			this.bucle();
			
		});

		this.input.on('pointerup', (pointer) => {
			//this.fireBullet();
			this.shoot = false;
		});

		// Firing bullets should also work on enter / spacebar press
		this.inputKeys = [
			this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
			this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
		];
	}

	fireBullet() {
		this.laserGroup.fireBullet(this.ship.x, this.ship.y - 20);
		this.time.delayedCall(200,this.bucle,[],this );

	}

	bucle(){
		if(this.shoot){
			this.fireBullet();
		}
		
		
		
		
	//}
	}
	
	update(time,delta) {
		// Loop over all keys
		
			// Check if the key was just pressed, and if so -> fire the bullet
		//console.log(time)

			//if(this.shoot){
				
			//}
		deltagame += delta;
		temposcore = Math.floor(deltagame/100);
		score = temposcore + destroyscore;
		scoreText.setText(score)
		//console.log(score);
		if(max<3){
		max = 1 + Math.floor(deltagame/(15000));
		//console.log(max);
		}
	}

	nuevaColumna() {
        //Una columna es un grupo de cubos
        const columna = this.physics.add.group();
		
        //Cada columna tendrá un hueco (zona en la que no hay cubos) por dónde pasará el super heroe
        const hueco = Math.floor(Math.random() * 3) + 1;
		let array = [];
        for (let i = 0; i < 6; i++) {
            //El hueco estará compuesto por dos posiciones en las que no hay cubos, por eso ponemos hueco +1
            if (i !== hueco && i !== hueco + 1) {
                const cubo = columna.create( i * 90 + 10,1, 'muro');
				//cubo.rotation += 1.6;
				
				///////////7
				array.push(i);
                cubo.body.allowGravity = false;
            }
        }
		for(let i = 0;i < max; i++){
			
				let si = Math.floor(Math.random()* array.length) ;
				//console.log(array)
				var turret = turrets.get();
       			if (turret)
      			{
       			    turret.setActive(true);
         			turret.setVisible(true);
        			turret.place(array[si] * 90, 1);
					//max = max -1;
					array.splice(si,1);
					this.physics.add.overlap(turret, this.laserGroup, this.damageEnemy, null, this);
					//console.log(array)
					//turret.setVelocityY(200);
        		} 
				
			
		}
        columna.setVelocityY(200);
        //Detectaremos cuando las columnas salen de la pantalla...
        columna.checkWorldBounds = true;
        //... y con la siguiente línea las eliminaremos
		//console.log(columna);
		//olumna.destroyCallback
		this.physics.add.overlap(this.ship, columna, this.hitColumna, null, this);
        columna.outOfBoundsKill = true;
        //Cada 1000 milisegundos llamaremos de nuevo a esta función para que genere una nueva columna
        this.time.delayedCall(2300, this.nuevaColumna, [], this);
		
		
    }
	damageEnemy(enemy, bullet) {  
		// only if both enemy and bullet are alive
		if (enemy.active === true && bullet.active === true) {
			// we remove the bullet right away
			bullet.setActive(false);
			bullet.setVisible(false);    
			
			// decrease the enemy hp with BULLET_DAMAGE
			enemy.receiveDamage(50);
		}
	}

	damageShip(ship, bullet) {  
		// only if both enemy and bullet are alive
		if (ship.active === true && bullet.active === true) {
			// we remove the bullet right away
			bullet.setActive(false);
			bullet.setVisible(false);    
			
			// decrease the enemy hp with BULLET_DAMAGE
			life-=50;
			//console.log(life);
			if(life<=0){
				this.scene.start('perderScene');
				alert('Fin del juego, te derribaron ');
				
	
			}
		}
	}

	hitColumna() {
		//console.log("prueba");
		alert('Fin del juego chocaste con un tubo ');
		
		this.scene.start('perderScene');
		
	}
}

class PerderEscena extends Phaser.Scene {
    constructor() {
        super({
            key: 'perderScene'
        });
    }

    preload() {
        this.load.image('perder', '/static/img/assets/finjuego.jpeg');
    }

    create() {
        this.add.image(225, 300, 'perder');
		alert('SCORE: ' + score);

		this.input.on('pointerdown', () => this.volverAJugar())
    }

	volverAJugar() {
        this.scene.start('init');
		score = 0;

	}	


}





function addBullet(x, y, angle) {
    var bullet = bullets.get();
    if (bullet)
    {
        bullet.fire(x, y, angle);
    }
}

const config = {
	type: Phaser.AUTO,
	width: 450, 
	height: 600,
	physics: {
		default: 'arcade',
		arcade: {
			debug: false,
			gravity: { y: 0 }
		}
	},
	scene: [SpaceScene, PerderEscena]
};

const game = new Phaser.Game(config);