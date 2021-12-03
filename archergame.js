import { defs, tiny } from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Scene, Shader, Material, Texture,
} = tiny;

const {Rounded_Capped_Cylinder, Square, Axis_Arrows, Textured_Phong, Grid_Sphere} = defs

//variables
let t;
const NUM_PARTICLES = 5;

class Arrow extends Shape {
    constructor() {
        super("position", "normal", "texture_coord");
        this.drawOneAxis(Mat4.identity(), [0, 1]);
    }


    drawOneAxis(transform, tex) {
        // Use a different texture coordinate range for each of the three axes, so they show up differently.
        defs.Closed_Cone.insert_transformed_copy_into(this, [4, 10, tex], transform.times(Mat4.translation(0, 0, 2)).times(Mat4.scale(.25, .25, .25)));
        defs.Cylindrical_Tube.insert_transformed_copy_into(this, [7, 7, tex], transform.times(Mat4.translation(0, 0, 1)).times(Mat4.scale(.1, .1, 2)));
    }
}

class Base_Scene extends Scene {
    /**
     *  **Base_scene** is a Scene that can be added to any display canvas.
     *  Setup the shapes, materials, camera, and lighting here.
     */
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();
        this.hover = this.swarm = false;
        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            square: new Square(),
            ground: new Square(),
            ground2: new Square(),
            tower: new Square(),
            bomb: new Grid_Sphere(),
            arrow: new Arrow(),
            sky: new Square(),
            particle: new Square(),

        };

        this.shapes.ground.arrays.texture_coord = this.shapes.ground.arrays.texture_coord.map(v => vec(v[0]*3, v[1]*3))
        this.shapes.ground2.arrays.texture_coord = this.shapes.ground2.arrays.texture_coord.map(v => vec(v[0]*3, v[1]*3))


        // *** Materials
        this.materials = {
            particle: new Material(new defs.Phong_Shader(),
                {
                    ambient: .4,
                    diffusivity: .6,
                    color: hex_color("#ff0000")
                }),
             tank: new Material(new Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 0.9, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/tank.png", "LINEAR_MIPMAP_LINEAR"),
             }),
             tower: new Material(new Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 0.9, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/metal.png", "LINEAR_MIPMAP_LINEAR"),
             }),
             grass: new Material(new Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 0.9, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/grass.jpg", "LINEAR_MIPMAP_LINEAR"),
             }),
             bunker: new Material(new Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 0.9, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/bunker.png", "LINEAR_MIPMAP_LINEAR"),
             }),
             bomb: new Material(new Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 0.9, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/bomb.png", "LINEAR_MIPMAP_LINEAR"),
             }),
             explosion: new Material(new Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 0.9, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/explosion.png", "LINEAR_MIPMAP_LINEAR"),
             }),
             sky: new Material(new Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 0.9, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/sky.png", "LINEAR_MIPMAP_LINEAR"),
             }),
        };
        this.first = true;
    }

    display(context, program_state) {
        // display():  Called once per frame of animation. Here, the base class's display only does
        // some initial setup.
        
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (this.first) {
            program_state.set_camera(Mat4.look_at(vec3(0, 0, 80), vec3(0, 0, 0), vec3(0, 1, 0)));
            this.first = false;
        }
        
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);

        // *** Lights: *** Values of vector or point lights.
        const light_position = vec4(0, 5, 5, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];
    }
}

class Element {
    constructor(x, y, scale, material, dx, dy, zscale, gravity, wind_strength, wind_direction) {
        this.x = x;
        this.y = y;
        this.scale = scale;
        this.material = material;
        this.dx = dx;
        this.dy = dy;
        this.zscale = zscale || 1;
        this.gravity = gravity || false;
        this.wind = wind_strength;
        this.wind_direction = wind_direction;
    }

    draw(context, program_state) {
        let model_transform = Mat4.identity();
        model_transform = model_transform
            .times(Mat4.translation(this.x, this.y, 0))
            .times(Mat4.scale(this.scale, this.scale, this.zscale));
        return [model_transform, this.material]
    }

    // Call once per frame
    update(context, program_state) {
        if (this.gravity) {
            this.dy -= .00861
        }

        //alter x and y based on wind and direction
        if (this.wind_direction == "West"){
            this.dx -= 0.001 * this.wind;
        } else if (this.wind_direction == "East"){
            this.dx += 0.001 * this.wind;
        }
        this.x += this.dx;
        
        if (this.wind_direction == "North"){
            this.dy += 0.001 * this.wind;
        } else if (this.wind_direction == "South"){
            this.dy -= 0.001 * this.wind;
        }
        this.y += this.dy;
        
        return this.draw(context, program_state);
    }
}

export class ArcherGame extends Base_Scene {
    constructor() {
        super();
        this.init();
    }

    make_control_panel() {
        this.live_string(box => box.textContent = `Score: ${this.score}, Lives: ${this.lives}, Wind: ${this.wind_strength1} mph ${this.wind_direction1}`);
        this.new_line();
        this.new_line();
        // shoot
        this.key_triggered_button("Shoot", ["c"], this.shootProjectile);
        this.key_triggered_button("Decrease angle", ["j"], () => {this.angle = Math.max(0, this.angle - 1)});
        this.key_triggered_button("Increase angle", ["l"], () => {this.angle = Math.min(180, this.angle + 1)});
        this.key_triggered_button("Decrease speed", ["u"], () => {this.speed = Math.max(20, this.speed - 1)});
        this.key_triggered_button("Increase speed", ["o"], () => {this.speed = Math.min(120, this.speed + 1)});

    }


    init() {
        this.score = 0;
        this.lives = 3;
        this.high_score = 0;
        this.wind_strength1 = Math.floor(Math.random() * 5);
        this.direction = Math.floor(Math.random() * 4) + 1;
        
        if (this.direction == 1){
            this.wind_direction1 = "North";
        } else if (this.direction == 2){
            this.wind_direction1 = "East";
        } else if (this.direction == 3){
            this.wind_direction1 = "South";
        } else if (this.direction == 4){
            this.wind_direction1 = "West";
        } else if (this.direction < 1 || this.direction > 4) {
            this.wind_direction1 = "ERROR";
        }

        this.level = Math.floor(Math.random()*(-95 +125))-125;

        this.tower = new Element(0, 0, 10, this.materials.tower, 0, 0);
        this.sky = new Element(0, 0, 30, this.materials.sky, 0, -1);
        this.archer = new Element(-20, 2.5, 5, this.materials.tank, 0, 0);
        this.target = new Element(20, this.level + 104.5, 5, this.materials.bunker, 0, 0);
        this.ground = new Element(-97, -102.5, 100, this.materials.grass, 0, 0, 1.1, false); 
        this.ground2 = new Element(97, this.level, 100, this.materials.grass, 0, 0, 1.1, false);
        this.angle = 45;
        this.speed = 50;
        
        this.test = new Element (10, 10, 15, this.materials.grass, 0, 0)

    }

    explode() {
        this.exploding = true;
        this.projectile.dx = 0;
        this.projectile.dy = 0;
        this.projectile.gravity = false;
        this.projectile.material = this.materials.explosion;
    }

    successful_hit() {
        if (this.exploding) return;
        this.explode();
        setTimeout(() => { 
            this.exploding = false;
            this.score++;
            this.randomize_parameters();
            this.projectile = undefined; 
        }, 2000);
    }

    failed_hit() {
        if (this.exploding) return;
        this.explode();
        setTimeout(() => { 
            this.exploding = false;
            this.lives--;
            this.projectile = undefined; 
            if (this.lives <= 0) setTimeout(this.game_over(), 2000);
        }, 2000);
    }

    game_over() {
        if (this.score > this.high_score){
            this.high_score = this.score;
            window.alert(`Game over! New high score: ${this.high_score}`);
        } else {
            window.alert(`Game over! Your score was ${this.score}. Previous high score: ${this.high_score}`);
        }
        window.location.reload();
    }

    randomize_parameters() {
        this.target.scale = 1 + 10 * Math.random();
        const min = 10;
        const max = 30;
        this.target.x = min + Math.random() * (max - min);
        this.target.y = this.level + 104.5 - 4/this.target.scale;
    }

    detect_collision( x1, y1, w1, h1, x2, y2, w2, h2 )
    {
        if (x2 - w2 > w1 + x1 || x1 - w1 > w2 + x2 || y2 - h2 > h1 + y1 || y1 - h1 > h2 + y2)
        {
            return false;
        }
        else 
        {
            return true;
        }
    }

    detect_tower_collision( x1, y1, w1, h1 )
    {
        // tower dependenant on scaled size 
        if ( x1 > -5 && x1 < 5 && y1 < 20 )
        {
            return true;
        }
        else 
        {
            return false;
        }
    }

    shootProjectile() {
        if (!this.projectile) {
            this.projectile = new Element(this.archer.x, this.archer.y, 2,
            this.materials.bomb,  0.2+(this.speed/100) * Math.cos(this.angle*Math.PI/180), 0.2+(this.speed/100) * Math.sin(this.angle*Math.PI/180), 1, true, this.wind_strength1, this.wind_direction1);
        }
    }

    drawObjects(context, program_state) {
//         this.shapes.sky.draw(context, program_state, ...this.sky.update(context, program_state));
        this.shapes.tower.draw(context, program_state, 
            Mat4.identity().times(Mat4.scale(3, 10, 1)).times(Mat4.translation(0, 0.75, 0))
        , this.materials.tower)
//         this.shapes.square.draw(context, program_state, ...this.archer.update(context, program_state));
        this.shapes.ground.draw(context, program_state, ...this.ground.update(context, program_state));
        this.shapes.ground2.draw(context, program_state, ...this.ground2.update(context, program_state));
        this.shapes.square.draw(context, program_state, ...this.target.update(context, program_state));

        const [archer_transform, archer_mat] = this.archer.update(context, program_state);
        // Draw archer
        this.shapes.square.draw(context, program_state, archer_transform, archer_mat);
        // Draw direction/power
        const rad_angle = this.angle*Math.PI/180;
        const arrow_transform = Mat4.identity()
        .times(archer_transform)
        .times(Mat4.rotation(rad_angle - Math.PI / 2, 0, 0, 1))
        .times(Mat4.scale(1, this.speed / 40, 1))
        .times(Mat4.translation(0, 0, 1.5))
        .times(Mat4.rotation(- Math.PI / 2, 1, 0, 0));
        this.shapes.arrow.draw(context, program_state, arrow_transform, this.materials.particle);
        if (this.projectile) {
            this.shapes.square.draw(context, program_state, ...this.projectile.update(context, program_state));
            if (this.detect_collision(this.projectile.x, this.projectile.y, this.projectile.scale, this.projectile.scale, this.target.x, this.target.y, this.target.scale, this.target.scale)){
                this.successful_hit();
            }
            if (this.detect_tower_collision(this.projectile.x, this.projectile.y, this.projectile.scale, this.projectile.scale) ){
                this.failed_hit();
            }
            if (this.detect_collision(this.projectile.x, this.projectile.y, this.projectile.scale, this.projectile.scale, this.ground2.x, this.ground2.y, this.ground2.scale, this.ground2.scale)){
                 this.failed_hit();
            }
            if (this.detect_collision(this.projectile.x, this.projectile.y, this.projectile.scale, this.projectile.scale, this.ground.x, this.ground.y, this.ground.scale, this.ground.scale)){
                 this.failed_hit();
            }
        }

        if (this.exploding) {
            for (let i = 0; i < NUM_PARTICLES; i++) {
                const particle_transform = Mat4.identity()
                .times(Mat4.translation(this.projectile.x + (Math.random()*(20)-10), this.projectile.y + (Math.random()*(20)-10), 0));
                this.shapes.particle.draw(context, program_state, particle_transform, this.materials.particle);
            }
        }
    }

    display(context, program_state) {
        super.display(context, program_state);
        this.drawObjects(context, program_state);
    }
}
