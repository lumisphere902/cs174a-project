import { defs, tiny } from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

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

class Actor {
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
        this.x += this.dx;
        this.y += this.dy;
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
        this.archer = new Actor(-20, 5, 5, this.materials.plastic.override({
            color: hex_color("#ff0000")
        }), 0, 0);
        this.target = new Actor(20, 10, 10, this.materials.plastic.override({
            color: hex_color("#00ff00")
        }), 0, 0);
        this.ground = new Actor(0, -100, 100, this.materials.plastic.override({
            color: hex_color("#964b00")
        }), 0, 0, 1.1);
    }

    make_control_panel() {
        // shoot
        this.key_triggered_button("Shoot", ["c"], this.shootProjectile);
    }

    shootProjectile() {
        if (!this.projectile) {
            this.projectile = new Actor(this.archer.x, this.archer.y, 2,
                this.materials.plastic.override({
                    color: hex_color("#0000ff")
                }), 0.1, 0);
        }
    }

    drawObjects(context, program_state) {
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
