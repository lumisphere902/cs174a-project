import { defs, tiny } from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Scene, Shader, Material, Texture,
} = tiny;

const {Rounded_Capped_Cylinder, Square, Axis_Arrows, Textured_Phong, Grid_Sphere} = defs

//variables
let angle = 45;
let speed = 40;
let t;



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
            tower: new Square(),
            bomb: new Grid_Sphere(),
        };

        this.shapes.ground.arrays.texture_coord = this.shapes.ground.arrays.texture_coord.map(v => vec(v[0]*3, v[1]*3))


        // *** Materials
        this.materials = {
            plastic: new Material(new defs.Phong_Shader(),
                {
                    ambient: .4,
                    diffusivity: .6,
                    color: hex_color("#ff0000")
                }),
             tank: new Material(new Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 0.9, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/tank.png", "LINEAR_MIPMAP_LINEAR")
             }),
             tower: new Material(new Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 0.9, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/metal.png", "LINEAR_MIPMAP_LINEAR")
             }),
             grass: new Material(new Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 0.9, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/grass.jpg", "LINEAR_MIPMAP_LINEAR")
             }),
             bunker: new Material(new Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 0.9, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/bunker.png", "LINEAR_MIPMAP_LINEAR")
             }),
             bomb: new Material(new Textured_Phong(), {
                color: hex_color("#000000"),
                ambient: 0.9, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/bomb.png", "LINEAR_MIPMAP_LINEAR")
             })
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
        const t = this.t = program_state.animation_time / 1000;
        let model_transform = Mat4.identity();
        model_transform = model_transform
            .times(Mat4.translation(this.x, this.y, 0))
            .times(Mat4.scale(this.scale, this.scale, this.zscale))
            
        return [model_transform, this.material]
    }

    // Call once per frame
    update(context, program_state) {
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
        //    constructor(x, y, scale, material, dx, dy, zscale)
        this.origin = new Element(0, 0, 1, this.materials.plastic.override({
            color: hex_color("#ffffff")
        }), 0, 0);
        this.tower = new Element(0, 0, 10, this.materials.tower, 0, 0);
        this.archer = new Element(-20, 2.5, 5, this.materials.tank, 0, 0);
        this.target = new Element(20, 2, 5, this.materials.bunker, 0, 0);
        this.ground = new Element(0, -102.5, 100, this.materials.grass, 0, 0, 1.1);
    }

    make_control_panel() {
        // shoot
        this.key_triggered_button("Shoot", ["c"], this.shootProjectile);
        this.key_triggered_button("Decrease angle", ["j"], () => {angle--; console.log(angle)});
        this.key_triggered_button("Increase angle", ["l"], () => {angle++; console.log(angle)});
        this.key_triggered_button("Decrease speed", ["u"], () => {speed--; console.log(speed)});
        this.key_triggered_button("Increase speed", ["o"], () => {speed++; console.log(speed)});
    }

    //this.dx = (speed/100) * Math.cos(angle);
    //this.dy = (speed/100) * Math.sin(angle) - 9.81*t;

    shootProjectile() {
        if (!this.projectile) {
            this.projectile = new Projectile(this.archer.x, this.archer.y, 2,
                this.materials.bomb,  0.2+(speed/100) * Math.cos(angle*Math.PI/180), 0.2+(speed/100) * Math.sin(angle*Math.PI/180));
        }
    }

    drawObjects(context, program_state) {


        //this.shapes.square.draw(context, program_state, ...this.origin.update(context, program_state));
        this.shapes.tower.draw(context, program_state, 
            Mat4.identity().times(Mat4.scale(3, 10, 1)).times(Mat4.translation(0, 0.75, 0))
        , this.materials.tower)
        //this.shapes.tower.draw(context, program_state, ...this.tower.update(context, program_state));
        this.shapes.square.draw(context, program_state, ...this.archer.update(context, program_state));
        this.shapes.ground.draw(context, program_state, ...this.ground.update(context, program_state));
        this.shapes.square.draw(context, program_state, ...this.target.update(context, program_state));
        if (this.projectile) {
            this.shapes.square.draw(context, program_state, ...this.projectile.update(context, program_state));
        }
    }

    display(context, program_state) {
        super.display(context, program_state);

        this.drawObjects(context, program_state);
    }
}
