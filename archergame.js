import { defs, tiny } from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

//variables
let angle = 45;
let speed = 40;
let t;

class Cube extends Shape {
    constructor() {
        super("position", "normal",);
        // Loop 3 times (for each axis), and inside loop twice (for opposing cube sides):
        this.arrays.position = Vector3.cast(
            [-1, -1, -1], [1, -1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, -1], [-1, 1, -1], [1, 1, 1], [-1, 1, 1],
            [-1, -1, -1], [-1, -1, 1], [-1, 1, -1], [-1, 1, 1], [1, -1, 1], [1, -1, -1], [1, 1, 1], [1, 1, -1],
            [-1, -1, 1], [1, -1, 1], [-1, 1, 1], [1, 1, 1], [1, -1, -1], [-1, -1, -1], [1, 1, -1], [-1, 1, -1]);
        this.arrays.normal = Vector3.cast(
            [0, -1, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0],
            [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0],
            [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]);
        // Arrange the vertices into a square shape in texture space too:
        this.indices.push(0, 1, 2, 1, 3, 2, 4, 5, 6, 5, 7, 6, 8, 9, 10, 9, 11, 10, 12, 13,
            14, 13, 15, 14, 16, 17, 18, 17, 19, 18, 20, 21, 22, 21, 23, 22);
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
            'cube': new Cube(),
        };

        // *** Materials
        this.materials = {
            plastic: new Material(new defs.Phong_Shader(),
                {
                    ambient: .4,
                    diffusivity: .6,
                    color: hex_color("#ffffff")
                }),
        };
    }

    display(context, program_state) {
        // display():  Called once per frame of animation. Here, the base class's display only does
        // some initial setup.
        
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(Mat4.look_at(vec3(0, 0, 80), vec3(0, 0, 0), vec3(0, 1, 0)));
        }
        
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);

        // *** Lights: *** Values of vector or point lights.
        const light_position = vec4(0, 5, 5, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];
    }
}

class Element {
    constructor(x, y, scale, material, dx, dy, zscale) {
        this.x = x;
        this.y = y;
        this.scale = scale;
        this.material = material;
        this.dx = dx;
        this.dy = dy;
        this.zscale = zscale || 1;
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
        //const dx = (speed/100) * Math.cos(angle);
        //const dy = (speed/100) * Math.sin(angle) - 9.81*t;
        //this.dy -= .41
//         console.log("dy: "+ this.dy)
//         console.log("dx: "+ this.dx)
//            t = program_state.animation_time / 1000;
//         this.x += this.dx;
//         this.y += this.dy;
        return this.draw(context, program_state);
    }
}

class Projectile {
    constructor(x, y, scale, material, dx, dy, zscale) {
        this.x = x;
        this.y = y;
        this.scale = scale;
        this.material = material;
        this.dx = dx;
        this.dy = dy;
        this.zscale = zscale || 1;
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
        //const dx = (speed/100) * Math.cos(angle);
        //const dy = (speed/100) * Math.sin(angle) - 9.81*t;
        

        if(this.y>0) {
          this.dy -= .00861
          console.log("dy: "+ this.dy)
          this.x += this.dx;
          this.y += this.dy;  
        }
        
        return this.draw(context, program_state);
    }
}


export class ArcherGame extends Base_Scene {
    /**
     * This Scene object can be added to any display canvas.
     * We isolate that code so it can be experimented with on its own.
     * This gives you a very small code sandbox for editing a simple scene, and for
     * experimenting with matrix transformations.
     */
    constructor() {
        super();
        this.colors = [];
        this.num_boxes = 8;
        this.sit_still = false;
        this.draw_outline = false;
        this.score = 0;
        //    constructor(x, y, scale, material, dx, dy, zscale)
        this.origin = new Element(0, 0, 1, this.materials.plastic.override({
            color: hex_color("#ffffff")
        }), 0, 0);
        this.archer = new Element(-20, 2.5, 5, this.materials.plastic.override({
            color: hex_color("#ff0000")
        }), 0, 0);
        this.target = new Element(20, .5, 3, this.materials.plastic.override({
            color: hex_color("#00ff00")
        }), 0, 0);
        this.ground = new Element(0, -102.5, 100, this.materials.plastic.override({
            color: hex_color("#964b00")
        }), 0, 0, 1.1);
    }

    make_control_panel() {
        this.live_string(box => box.textContent = `Score: ${this.score}`);
        this.new_line();
        this.new_line();
        // shoot
        this.key_triggered_button("Shoot", ["c"], this.shootProjectile);
        this.key_triggered_button("Decrease angle", ["j"], () => {angle--; console.log(angle)});
        this.key_triggered_button("Increase angle", ["l"], () => {angle++; console.log(angle)});
        this.key_triggered_button("Decrease speed", ["u"], () => {speed--; console.log(speed)});
        this.key_triggered_button("Increase speed", ["o"], () => {speed++; console.log(speed)});
        this.key_triggered_button("Successful hit (debug)", ["q"], this.successful_hit);
    }

    //this.dx = (speed/100) * Math.cos(angle);
    //this.dy = (speed/100) * Math.sin(angle) - 9.81*t;

    successful_hit() {
        this.score++;
        this.randomize_parameters();
        this.projecitle = undefined;
    }

    randomize_parameters() {
        this.target.scale = 1 + 10 * Math.random();
        const min = this.target.scale;
        const max = 30;
        this.target.x = min + Math.random() * (max - min);
        this.target.y = min + Math.random() * (max - min);
    }

    shootProjectile() {
        if (!this.projectile) {
            this.projectile = new Projectile(this.archer.x, this.archer.y, 2,
                this.materials.plastic.override({
                    color: hex_color("#0000ff")
                }),  0.2+(speed/100) * Math.cos(angle*Math.PI/180), 0.2+(speed/100) * Math.sin(angle*Math.PI/180));

        }
    }

    drawObjects(context, program_state) {
        //this.shapes.cube.draw(context, program_state, ...this.origin.update(context, program_state));
        this.shapes.cube.draw(context, program_state, ...this.archer.update(context, program_state));
        this.shapes.cube.draw(context, program_state, ...this.ground.update(context, program_state));
        this.shapes.cube.draw(context, program_state, ...this.target.update(context, program_state));
        if (this.projectile) {
            this.shapes.cube.draw(context, program_state, ...this.projectile.update(context, program_state));
        }
    }

    display(context, program_state) {
        super.display(context, program_state);

        this.drawObjects(context, program_state);
    }
}
