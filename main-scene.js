class Test_Data
{                             // **Test_Data** pre-loads some Shapes and Textures that other Scenes can borrow.
  constructor()
  { this.textures = {
    ground : new Texture( "asset/ground.png" ),

  }
    // this.shapes = { donut  : new defs.Torus          ( 15, 15, [[0,2],[0,1]] ),
    //   cone   : new defs.Closed_Cone    ( 4, 10,  [[0,2],[0,1]] ),
    //   capped : new defs.Capped_Cylinder( 4, 12,  [[0,2],[0,1]] ),
    //   ball   : new defs.Subdivision_Sphere( 3,   [[0,1],[0,1]] ),
    //   cube   : new defs.Cube(),
    //   prism  : new ( defs.Capped_Cylinder   .prototype.make_flat_shaded_version() )( 10, 10, [[0,2],[0,1]] ),
    //   gem    : new ( defs.Subdivision_Sphere.prototype.make_flat_shaded_version() )( 2 ),
    //   donut2 : new ( defs.Torus             .prototype.make_flat_shaded_version() )( 20, 20, [[0,2],[0,1]] ),
    // };
  }
  random_shape( shape_list = this.shapes )
  {                                       // random_shape():  Extract a random shape from this.shapes.
    const shape_names = Object.keys( shape_list );
    return shape_list[ shape_names[ ~~( shape_names.length * Math.random() ) ] ]
  }
}

window.Assignment_Three_Scene = window.classes.Assignment_Three_Scene =
class Assignment_Three_Scene extends Scene_Component
  { constructor( context, control_box )     // The scene begins by requesting the camera, shapes, and materials it will need.
      { super(   context, control_box );    // First, include a secondary Scene that provides movement controls:
        if( !context.globals.has_controls   )
          context.register_scene_component( new Movement_Controls( context, control_box.parentElement.insertCell() ) );

        context.globals.graphics_state.camera_transform = Mat4.look_at( Vec.of( 0,10,20 ), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) );
        this.initial_camera_location = Mat4.inverse( context.globals.graphics_state.camera_transform );

        const r = context.width/context.height;
        context.globals.graphics_state.projection_transform = Mat4.perspective( Math.PI/4, r, .1, 1000 );

        const shapes = { torus:  new Torus( 15, 15 ),
                         torus2: new ( Torus.prototype.make_flat_shaded_version() )( 15, 15 ),
                         block : new Cube(),
            square: new Square()

                                // TODO:  Fill in as many additional shape instances as needed in this key/value table.
                                //        (Requirement 1)
                       }
        this.submit_shapes( context, shapes );

                                     // Make some Material objects available to you:
        this.materials =
          { test:     context.get_instance( Phong_Shader ).material( Color.of( 1,1,0,1 ), { ambient:.2 } ),
              earth: context.get_instance( Phong_Shader ).material(Color.of(0,0,0,1), {ambient: 1, texture: context.get_instance("assets/ground.jpeg", false)})
            //ring:     context.get_instance( Ring_Shader  ).material()

                                // TODO:  Fill in as many additional material objects as needed in this key/value table.
                                //        (Requirement 1)
          }

          //this.data = new Test_Data();
        this.lights = [ new Light( Vec.of( 5,-10,5,1 ), Color.of( 0, 1, 1, 1 ), 1000 ) ];
      }
    make_control_panel()            // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
      { this.key_triggered_button( "View solar system",  [ "0" ], () => this.attached = () => this.initial_camera_location );
        this.new_line();
        this.key_triggered_button( "Attach to planet 1", [ "1" ], () => this.attached = () => this.planet_1 );
        this.key_triggered_button( "Attach to planet 2", [ "2" ], () => this.attached = () => this.planet_2 ); this.new_line();
        this.key_triggered_button( "Attach to planet 3", [ "3" ], () => this.attached = () => this.planet_3 );
        this.key_triggered_button( "Attach to planet 4", [ "4" ], () => this.attached = () => this.planet_4 ); this.new_line();
        this.key_triggered_button( "Attach to planet 5", [ "5" ], () => this.attached = () => this.planet_5 );
        this.key_triggered_button( "Attach to moon",     [ "m" ], () => this.attached = () => this.moon     );
      }

    create_ground(graphics_state, model_transform) {
        model_transform = model_transform.times( Mat4.translation( [0,-10,0] )).times( Mat4.rotation( Math.PI/2,   Vec.of(1,0,0) ) ).times( Mat4.scale( [50,50,1] ) );

        this.shapes.square.draw( graphics_state,  model_transform ,
            this.materials.earth);
        model_transform = model_transform.times(Mat4.scale([1/50, 1/50,1])).times(Mat4.rotation(Math.PI/2, Vec.of(-1,0,0)))
        model_transform = model_transform.times(Mat4.translation([0,1,0]))
        return model_transform;
    }

    create_wall(graphics_state, model_transform) {
        for(var i = 0; i < 10; i++) {
            for(var j = 0; j < 10; j++) {
                model_transform= model_transform
                    .times( Mat4.translation([2,0,0]));
                this.shapes.block.draw(graphics_state, model_transform, this.materials.test);
            }
            model_transform = model_transform
                .times( Mat4.translation([-20, 2,0]));
        }
        return model_transform;

    }

    display( graphics_state )
      { graphics_state.lights = this.lights;        // Use the lights stored in this.lights.
        const t = graphics_state.animation_time / 1000, dt = graphics_state.animation_delta_time / 1000;



        // TODO:  Fill in matrix operations and drawing code to draw the solar system scene (Requirements 2 and 3)

        let model_transform = this.create_ground(graphics_state, Mat4.identity());
        model_transform = this.create_wall(graphics_state, model_transform);

      }
  }


window.Cube = window.classes.Cube =
    class Cube extends Shape                 // Here's a complete, working example of a Shape subclass.  It is a blueprint for a cube.
    { constructor()
    { super( "positions", "normals" ); // Name the values we'll define per each vertex.  They'll have positions and normals.

        // First, specify the vertex positions -- just a bunch of points that exist at the corners of an imaginary cube.
        this.positions.push( ...Vec.cast( [-1,-1,-1], [1,-1,-1], [-1,-1,1], [1,-1,1], [1,1,-1],  [-1,1,-1],  [1,1,1],  [-1,1,1],
            [-1,-1,-1], [-1,-1,1], [-1,1,-1], [-1,1,1], [1,-1,1],  [1,-1,-1],  [1,1,1],  [1,1,-1],
            [-1,-1,1],  [1,-1,1],  [-1,1,1],  [1,1,1], [1,-1,-1], [-1,-1,-1], [1,1,-1], [-1,1,-1] ) );
        // Supply vectors that point away from eace face of the cube.  They should match up with the points in the above list
        // Normal vectors are needed so the graphics engine can know if the shape is pointed at light or not, and color it accordingly.
        this.normals.push(   ...Vec.cast( [0,-1,0], [0,-1,0], [0,-1,0], [0,-1,0], [0,1,0], [0,1,0], [0,1,0], [0,1,0], [-1,0,0], [-1,0,0],
            [-1,0,0], [-1,0,0], [1,0,0],  [1,0,0],  [1,0,0], [1,0,0], [0,0,1], [0,0,1], [0,0,1],   [0,0,1],
            [0,0,-1], [0,0,-1], [0,0,-1], [0,0,-1] ) );

        // Those two lists, positions and normals, fully describe the "vertices".  What's the "i"th vertex?  Simply the combined
        // data you get if you look up index "i" of both lists above -- a position and a normal vector, together.  Now let's
        // tell it how to connect vertex entries into triangles.  Every three indices in this list makes one triangle:
        this.indices.push( 0, 1, 2, 1, 3, 2, 4, 5, 6, 5, 7, 6, 8, 9, 10, 9, 11, 10, 12, 13,
            14, 13, 15, 14, 16, 17, 18, 17, 19, 18, 20, 21, 22, 21, 23, 22 );
        // It stinks to manage arrays this big.  Later we'll show code that generates these same cube vertices more automatically.
    }
    }