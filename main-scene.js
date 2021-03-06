var score_global;
var remaining_balls;
var curr_level;
var status = 0;
class Vector extends Float32Array
{                                   // **Vector** stores vectors of floating point numbers.  Puts vector math into JavaScript.
                                    // Note:  Vectors should be created with of() due to wierdness with the TypedArray spec.
                                    // Tip: Assign Vectors with .copy() to avoid referring two variables to the same Vector object.
  static create( ...arr )
    { return new Vector( arr );
    }
  copy()
    { return new Vector( this ) }
  equals( b )
    { return this.every( (x,i) => x == b[i] ) }
  plus( b )
    { return this.map(   (x,i) => x +  b[i] ) }
  minus( b )
    { return this.map(   (x,i) => x -  b[i] ) }
  times_pairwise( b )
    { return this.map(   (x,i) => x *  b[i] ) }
  scale_by( s )
    { this.forEach(  (x, i, a) => a[i] *= s ) }
  times( s )
    { return this.map(       x => s*x ) }
  randomized( s )
    { return this.map(       x => x + s*(Math.random()-.5) ) }
  mix( b, s )
    { return this.map(   (x,i) => (1-s)*x + s*b[i] ) }
  norm()
    { return Math.sqrt( this.dot( this ) ) }
  normalized()
    { return this.times( 1/this.norm() ) }
  normalize()
    {     this.scale_by( 1/this.norm() ) }
  dot(b)
    { if( this.length == 2 )                    // Optimize for Vectors of size 2
        return this[0]*b[0] + this[1]*b[1];
      return this.reduce( ( acc, x, i ) => { return acc + x*b[i]; }, 0 );
    }
  static cast( ...args )
                            // cast(): For compact syntax when declaring lists.
    { return args.map( x => Vector.from(x) ) }
                // to3() / to4() / cross():  For standardizing the API with Vector3/Vector4, so
                // the performance hit of changing between these types can be measured.
  to3()
    { return vec3( this[0], this[1], this[2]              ); }
  to4( is_a_point )
    { return vec4( this[0], this[1], this[2], +is_a_point ); }
  cross(b)
    { return vec3( this[1]*b[2] - this[2]*b[1], this[2]*b[0] - this[0]*b[2], this[0]*b[1] - this[1]*b[0] ); }
  to_string() { return "[vector " + this.join( ", " ) + "]" }
}


class Vector3 extends Float32Array
{                                 // **Vector3** is a specialization of Vector only for size 3, for performance reasons.
  static create( x, y, z )
    { const v = new Vector3( 3 );
      v[0] = x; v[1] = y; v[2] = z;
      return v;
    }
  copy()
    { return Vector3.from( this ) }
                                              // In-fix operations: Use these for more readable math expressions.
  equals( b )
    { return this[0] == b[0] && this[1] == b[1] && this[2] == b[2] }
  plus( b )
    { return vec3( this[0]+b[0], this[1]+b[1], this[2]+b[2] ) }
  minus( b )
    { return vec3( this[0]-b[0], this[1]-b[1], this[2]-b[2] ) }
  times( s )
    { return vec3( this[0]*s,    this[1]*s,    this[2]*s    ) }
  times_pairwise( b )
    { return vec3( this[0]*b[0], this[1]*b[1], this[2]*b[2] ) }
                                            // Pre-fix operations: Use these for better performance (to avoid new allocation).
  add_by( b )
    { this[0] += b[0];  this[1] += b[1];  this[2] += b[2] }
  subtract_by( b )
    { this[0] -= b[0];  this[1] -= b[1];  this[2] -= b[2] }
  scale_by( s )
    { this[0] *= s;  this[1] *= s;  this[2] *= s }
  scale_pairwise_by( b )
    { this[0] *= b[0];  this[1] *= b[1];  this[2] *= b[2] }
                                            // Other operations:
  randomized( s )
    { return vec3( this[0]+s*(Math.random()-.5),
                   this[1]+s*(Math.random()-.5),
                   this[2]+s*(Math.random()-.5) );
    }
  mix( b, s )
    { return vec3( (1-s)*this[0] + s*b[0],
                   (1-s)*this[1] + s*b[1],
                   (1-s)*this[2] + s*b[2] );
    }
  norm()
    { return Math.sqrt( this[0]*this[0] + this[1]*this[1] + this[2]*this[2] ) }
  normalized()
    { const d = 1/this.norm();
      return vec3( this[0]*d, this[1]*d, this[2]*d );
    }
  normalize()
    { const d = 1/this.norm();
      this[0] *= d;  this[1] *= d;  this[2] *= d;
    }
  dot( b )
    { return this[0]*b[0] + this[1]*b[1] + this[2]*b[2] }
  cross( b )
    { return vec3( this[1]*b[2] - this[2]*b[1],
                   this[2]*b[0] - this[0]*b[2],
                   this[0]*b[1] - this[1]*b[0]  ) }
  static cast( ...args )
    {                             // cast(): Converts a bunch of arrays into a bunch of vec3's.
      return args.map( x => Vector3.from( x ) );
    }
  static unsafe( x,y,z )
    {                // unsafe(): returns vec3s only meant to be consumed immediately. Aliases into
                     // shared memory, to be overwritten upon next unsafe3 call.  Faster.
      const shared_memory = vec3( 0,0,0 );
      Vector3.unsafe = ( x,y,z ) =>
        { shared_memory[0] = x;  shared_memory[1] = y;  shared_memory[2] = z;
          return shared_memory;
        }
      return Vector3.unsafe( x,y,z );
    }
  to4( is_a_point )
                    // to4():  Convert to a homogeneous vector of 4 values.
    { return vec4( this[0], this[1], this[2], +is_a_point ) }
  to_string()
    { return "[vec3 " + this.join( ", " ) + "]" }
}

class Vector4 extends Float32Array
{                                 // **Vector4** is a specialization of Vector only for size 4, for performance reasons.
                                  // The fourth coordinate value is homogenized (0 for a vector, 1 for a point).
  static create( x, y, z, w )
    { const v = new Vector4( 4 );
      v[0] = x; v[1] = y; v[2] = z; v[3] = w;
      return v;
    }
  copy()
    { return Vector4.from( this ) }
                                            // In-fix operations: Use these for more readable math expressions.
  equals()
    { return this[0] == b[0] && this[1] == b[1] && this[2] == b[2] && this[3] == b[3] }
  plus( b )
    { return vec4( this[0]+b[0], this[1]+b[1], this[2]+b[2], this[3]+b[3] ) }
  minus( b )
    { return vec4( this[0]-b[0], this[1]-b[1], this[2]-b[2], this[3]-b[3] ) }
  times( s )
    { return vec4( this[0]*s, this[1]*s, this[2]*s, this[3]*s ) }
  times_pairwise( b )
    { return vec4( this[0]*b[0], this[1]*b[1], this[2]*b[2], this[3]*b[3] ) }
                                            // Pre-fix operations: Use these for better performance (to avoid new allocation).
  add_by( b )
    { this[0] += b[0];  this[1] += b[1];  this[2] += b[2];  this[3] += b[3] }
  subtract_by( b )
    { this[0] -= b[0];  this[1] -= b[1];  this[2] -= b[2];  this[3] -= b[3] }
  scale_by( s )
    { this[0] *= s;  this[1] *= s;  this[2] *= s;  this[3] *= s }
  scale_pairwise_by( b )
    { this[0] *= b[0];  this[1] *= b[1];  this[2] *= b[2];  this[3] *= b[3] }
                                            // Other operations:
  randomized( s )
    { return vec4( this[0]+s*(Math.random()-.5),
                   this[1]+s*(Math.random()-.5),
                   this[2]+s*(Math.random()-.5),
                   this[3]+s*(Math.random()-.5) );
    }
  mix( b, s )
    { return vec4( (1-s)*this[0] + s*b[0],
                   (1-s)*this[1] + s*b[1],
                   (1-s)*this[2] + s*b[2],
                   (1-s)*this[3] + s*b[3] );
    }
                // The norms should behave like for Vector3 because of the homogenous format.
  norm()
    { return Math.sqrt( this[0]*this[0] + this[1]*this[1] + this[2]*this[2] ) }
  normalized()
    { const d = 1/this.norm();
      return vec4( this[0]*d, this[1]*d, this[2]*d, this[3] );    // (leaves the 4th coord alone)
    }
  normalize()
    { const d = 1/this.norm();
      this[0] *= d;  this[1] *= d;  this[2] *= d;                 // (leaves the 4th coord alone)
    }
  dot( b )
    { return this[0]*b[0] + this[1]*b[1] + this[2]*b[2] + this[3]*b[3] }
  static unsafe( x, y, z, w )
    {                // **unsafe** Returns vec3s to be used immediately only. Aliases into
                     // shared memory to be overwritten on next unsafe3 call.  Faster.
      const shared_memory = vec4( 0,0,0,0 );
      Vec4.unsafe = ( x,y,z,w ) =>
        { shared_memory[0] = x;  shared_memory[1] = y;
          shared_memory[2] = z;  shared_memory[3] = w; }
    }
  to3()
    { return vec3( this[0], this[1], this[2] ) }
  to_string()
    { return "[vec4 " + this.join( ", " ) + "]" }
}

const vec     = Vector .create;
const vec3    = Vector3.create;
const vec4    = Vector4.create;
const unsafe3 = Vector3.unsafe;
const unsafe4 = Vector4.unsafe;


class Body
{                                   // **Body** can store and update the properties of a 3D body that incrementally
                                    // moves from its previous place due to velocities.  It conforms to the
                                    // approach outlined in the "Fix Your Timestep!" blog post by Glenn Fiedler.
  constructor( shape, material, size )
    { Object.assign( this,
             { shape, material, size } )
    }
  emplace( location_matrix, linear_velocity, angular_velocity, spin_axis = vec3( 1,0,0 ).randomized(1).normalized() )
    {                               // emplace(): assign the body's initial values, or overwrite them.

      this.center   = location_matrix.times( vec4( 0,0,0,1 ) ).to3();
      let translate_point = this.center.times( -1 );
      this.rotation = Mat4.translation( [translate_point[0], translate_point[1], translate_point[2]] ).times( location_matrix );
      this.previous = { center: this.center.copy(), rotation: this.rotation.copy() };
                                              // drawn_location gets replaced with an interpolated quantity:
      this.drawn_location = location_matrix;
      this.temp_matrix = Mat4.identity();
      return Object.assign( this, { linear_velocity, angular_velocity, spin_axis } )
    }
  advance( time_amount )
    {                           // advance(): Perform an integration (the simplistic Forward Euler method) to
                                // advance all the linear and angular velocities one time-step forward.
      this.previous = { center: this.center.copy(), rotation: this.rotation.copy() };
                                                 // Apply the velocities scaled proportionally to real time (time_amount):
                                                 // Linear velocity first, then angular:
      this.center = this.center.plus( this.linear_velocity.times( time_amount ) );

      if (this.angular_velocity != 0) {
        this.rotation.pre_multiply( Mat4.rotation( time_amount * this.angular_velocity, Vec.of(this.spin_axis[0], this.spin_axis[1], this.spin_axis[2]) ) );
      }
    }
  blend_rotation( alpha )
    {                        // blend_rotation(): Just naively do a linear blend of the rotations, which looks
                             // ok sometimes but otherwise produces shear matrices, a wrong result.

                                  // TODO:  Replace this function with proper quaternion blending, and perhaps
                                  // store this.rotation in quaternion form instead for compactness.
       return this.rotation.map( (x,i) => vec4( ...this.previous.rotation[i] ).mix( x, alpha ) );
    }
  blend_state( alpha )
    {                             // blend_state(): Compute the final matrix we'll draw using the previous two physical
                                  // locations the object occupied.  We'll interpolate between these two states as
                                  // described at the end of the "Fix Your Timestep!" blog post.
      let translate_point =  this.previous.center.mix( this.center, alpha );
      this.drawn_location = Mat4.translation( [translate_point[0], translate_point[1], translate_point[2]] )
                                      .times( this.blend_rotation( alpha ) )
                                      .times( Mat4.scale( this.size ) );
    }
                                              // The following are our various functions for testing a single point,
                                              // p, against some analytically-known geometric volume formula
                                              // (within some margin of distance).
  static intersect_cube( p, margin = 0 )
    { return p.every( value => value >= -1 - margin && value <=  1 + margin )
    }
  static intersect_sphere( p, margin = 0 )
    { return p.dot( p ) < 1 + margin;
    }
  check_if_colliding( b, collider )
    {                                     // check_if_colliding(): Collision detection function.
                                          // DISCLAIMER:  The collision method shown below is not used by anyone; it's just very quick
                                          // to code.  Making every collision body an ellipsoid is kind of a hack, and looping
                                          // through a list of discrete sphere points to see if the ellipsoids intersect is *really* a
                                          // hack (there are perfectly good analytic expressions that can test if two ellipsoids
                                          // intersect without discretizing them into points).
      if ( this == b )
        return false;                     // Nothing collides with itself.
                                          // Convert sphere b to the frame where a is a unit sphere:

      let inverse = Mat4.inverse(this.drawn_location);

      const T = inverse.times( b.drawn_location, this.temp_matrix );

      const { intersect_test, points, leeway } = collider;

                                          // For each vertex in that b, shift to the coordinate frame of
                                          // a_inv*b.  Check if in that coordinate frame it penetrates
                                          // the unit sphere at the origin.  Leave some leeway.
      return points.positions.some( p =>
        intersect_test( T.times( p.to4(1) ).to3(), leeway ) );
    }
}


window.ScorePanel = window.classes.ScorePanel =
class ScorePanel extends Scene_Component    // Movement_Controls is a Scene_Component that can be attached to a canvas, like any 
{                                                  // other Scene, but it is a Secondary Scene Component -- meant to stack alongside other
                                                   // scenes.  Rather than drawing anything it embeds both first-person and third-person
                                                   // style controls into the website.  These can be uesd to manually move your camera or
                                                   // other objects smoothly through your scene using key, mouse, and HTML button controls
                                                   // to help you explore what's in it.
  constructor( context, control_box, canvas = context.canvas )
    { super( context, control_box );
      [ this.context, this.roll, this.look_around_locked, this.invert ] = [ context, 0, true, true ];                  // Data members
      [ this.thrust, this.pos, this.z_axis ] = [ Vec.of( 0,0,0 ), Vec.of( 0,0,0 ), Vec.of( 0,0,0 ) ];
                                                 // The camera matrix is not actually stored here inside Movement_Controls; instead, track
                                                 // an external matrix to modify. This target is a reference (made with closures) kept
                                                 // in "globals" so it can be seen and set by other classes.  Initially, the default target
                                                 // is the camera matrix that Shaders use, stored in the global graphics_state object.
      this.target = function() { return context.globals.movement_controls_target() }
      context.globals.movement_controls_target = function(t) { return context.globals.graphics_state.camera_transform };
      context.globals.movement_controls_invert = this.will_invert = () => true;
      context.globals.has_controls = true;

      [ this.radians_per_frame, this.meters_per_frame, this.speed_multiplier ] = [ 1/200, 20, 1 ];
      
      // *** Mouse controls: ***
      this.mouse = { "from_center": Vec.of( 0,0 ) };                           // Measure mouse steering, for rotating the flyaround camera:
      const mouse_position = ( e, rect = canvas.getBoundingClientRect() ) => 
                                   Vec.of( e.clientX - (rect.left + rect.right)/2, e.clientY - (rect.bottom + rect.top)/2 );
                                        // Set up mouse response.  The last one stops us from reacting if the mouse leaves the canvas.
      document.addEventListener( "mouseup",   e => { this.mouse.anchor = undefined; } );
      canvas  .addEventListener( "mousedown", e => { e.preventDefault(); this.mouse.anchor      = mouse_position(e); } );
      canvas  .addEventListener( "mousemove", e => { e.preventDefault(); this.mouse.from_center = mouse_position(e); } );
      canvas  .addEventListener( "mouseout",  e => { if( !this.mouse.anchor ) this.mouse.from_center.scale(0) } );  
    }
  show_explanation( document_element ) { }
  make_control_panel()                                                        // This function of a scene sets up its keyboard shortcuts.
    { const globals = this.globals;
      // this.key_triggered_button( "Up",     [ " " ], () => this.thrust[1] = -1, undefined, () => this.thrust[1] = 0 );
      // this.key_triggered_button( "Forward",[ "w" ], () => this.thrust[2] =  1, undefined, () => this.thrust[2] = 0 );  this.new_line();
      // this.key_triggered_button( "Left",   [ "a" ], () => this.thrust[0] =  1, undefined, () => this.thrust[0] = 0 );
      // this.key_triggered_button( "Back",   [ "s" ], () => this.thrust[2] = -1, undefined, () => this.thrust[2] = 0 );
      // this.key_triggered_button( "Right",  [ "d" ], () => this.thrust[0] = -1, undefined, () => this.thrust[0] = 0 );  this.new_line();
      // this.key_triggered_button( "Down",   [ "z" ], () => this.thrust[1] =  1, undefined, () => this.thrust[1] = 0 ); 

      // const speed_controls = this.control_panel.appendChild( document.createElement( "span" ) );
      // speed_controls.style.margin = "30px";
      // this.key_triggered_button( "-",  [ "o" ], () => this.speed_multiplier  /=  1.2, "green", undefined, undefined, speed_controls );
      // this.live_string( box => { box.textContent = "Speed: " + this.speed_multiplier.toFixed(2) }, speed_controls );
      // this.key_triggered_button( "+",  [ "p" ], () => this.speed_multiplier  *=  1.2, "green", undefined, undefined, speed_controls );
      // this.new_line();
      // this.key_triggered_button( "Roll left",  [ "," ], () => this.roll =  1, undefined, () => this.roll = 0 );
      // this.key_triggered_button( "Roll right", [ "." ], () => this.roll = -1, undefined, () => this.roll = 0 );  this.new_line();
      // this.key_triggered_button( "(Un)freeze mouse look around", [ "f" ], () => this.look_around_locked ^=  1, "green" );
      // this.new_line();
      // this.live_string( box => box.textContent = "Position: " + this.pos[0].toFixed(2) + ", " + this.pos[1].toFixed(2) 
      //                                                  + ", " + this.pos[2].toFixed(2) );
      
        this.new_line();        // The facing directions are actually affected by the left hand rule:
        this.live_string( box => box.textContent = (status == 0 ? "Score: " : "FINAL SCORE:") + score_global);
        this.new_line();        // The facing directions are actually affected by the left hand rule:
        this.live_string( box => box.textContent = (status == 0 ? "Total Ammo remaining: " + remaining_balls : (status == 1 ? "CONGRATS ON BEATING ALL 5 LEVELS" : "GAME OVER, GET BETTER ")));
        this.new_line();
        this.live_string( box => box.textContent = "Current Level:" + curr_level);
     
      // this.new_line();     
      // this.key_triggered_button( "Go to world origin", [ "r" ], () => this.target().set_identity( 4,4 ), "orange" );  this.new_line();
      // this.key_triggered_button( "Attach to global camera", [ "Shift", "R" ], () => 
      //                                     globals.movement_controls_target = () => globals.graphics_state.camera_transform, "blue" );
      // this.new_line();
    }
  first_person_flyaround( radians_per_frame, meters_per_frame, leeway = 70 )
    { const sign = this.will_invert ? 1 : -1;
      const do_operation = this.target()[ this.will_invert ? "pre_multiply" : "post_multiply" ].bind( this.target() );
                                                                      // Compare mouse's location to all four corners of a dead box.
      const offsets_from_dead_box = { plus: [ this.mouse.from_center[0] + leeway, this.mouse.from_center[1] + leeway ],
                                     minus: [ this.mouse.from_center[0] - leeway, this.mouse.from_center[1] - leeway ] }; 
                // Apply a camera rotation movement, but only when the mouse is past a minimum distance (leeway) from the canvas's center:
      if( !this.look_around_locked ) 
        for( let i = 0; i < 2; i++ )      // Steer according to "mouse_from_center" vector, but don't 
        {                                 // start increasing until outside a leeway window from the center.
          let o = offsets_from_dead_box,                                          // The &&'s in the next line might zero the vectors out:
            velocity = ( ( o.minus[i] > 0 && o.minus[i] ) || ( o.plus[i] < 0 && o.plus[i] ) ) * radians_per_frame;
          do_operation( Mat4.rotation( sign * velocity, Vec.of( i, 1-i, 0 ) ) );   // On X step, rotate around Y axis, and vice versa.
        }
      if( this.roll != 0 ) do_operation( Mat4.rotation( sign * .1, Vec.of(0, 0, this.roll ) ) );
                                                  // Now apply translation movement of the camera, in the newest local coordinate frame.
      do_operation( Mat4.translation( this.thrust.times( sign * meters_per_frame ) ) );
    }
  third_person_arcball( radians_per_frame )
    { const sign = this.will_invert ? 1 : -1;
      const do_operation = this.target()[ this.will_invert ? "pre_multiply" : "post_multiply" ].bind( this.target() );
      const dragging_vector = this.mouse.from_center.minus( this.mouse.anchor );               // Spin the scene around a point on an
      if( dragging_vector.norm() <= 0 ) return;                                                // axis determined by user mouse drag.
      do_operation( Mat4.translation([ 0,0, sign *  25 ]) );           // The presumed distance to the scene is a hard-coded 25 units.
      do_operation( Mat4.rotation( radians_per_frame * dragging_vector.norm(), Vec.of( dragging_vector[1], dragging_vector[0], 0 ) ) );
      do_operation( Mat4.translation([ 0,0, sign * -25 ]) );
    }
  display( graphics_state, dt = graphics_state.animation_delta_time / 1000 )    // Camera code starts here.
    { const m = this.speed_multiplier * this. meters_per_frame,
            r = this.speed_multiplier * this.radians_per_frame;
      this.first_person_flyaround( dt * r, dt * m );     // Do first-person.  Scale the normal camera aiming speed by dt for smoothness.
      if( this.mouse.anchor )                            // Also apply third-person "arcball" camera mode if a mouse drag is occurring.  
        this.third_person_arcball( dt * r);           
      
      const inv = Mat4.inverse( this.target() );
      this.pos = inv.times( Vec.of( 0,0,0,1 ) ); this.z_axis = inv.times( Vec.of( 0,0,1,0 ) );      // Log some values.
    }
}





window.Tanks = window.classes.Tanks =
class Tanks extends Scene_Component
  { constructor( context, control_box )     // The scene begins by requesting the camera, shapes, and materials it will need.
      { super(   context, control_box );    // First, include a secondary Scene that provides movement controls:
        if( !context.globals.has_controls   )
          context.register_scene_component( new ScorePanel( context, control_box.parentElement.insertCell() ) );

        context.globals.graphics_state.camera_transform = Mat4.look_at( Vec.of( 7.85,40.51,-158.78 ), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) );
        this.initial_camera_location = Mat4.inverse( context.globals.graphics_state.camera_transform );
        const r = context.width/context.height;
        context.globals.graphics_state.projection_transform = Mat4.perspective( Math.PI/4, r, .1, 1000 );
        this.gl = context.gl;

        

        this.shapes = {
                         block : new Cube(),
                         square: new Square(),
                         block_texture: new Cube_P(),
                         ball: new Subdivision_Sphere(4),

                         sun: new Subdivision_Sphere(4)
                                // TODO:  Fill in as many additional shape instances as needed in this key/value table.
                                //        (Requirement 1)
                       }
        this.colliders = [
          { intersect_test: Body.intersect_cube,   points: new Cube(),  leeway: .1 },
          { intersect_test: Body.intersect_sphere,   points: new Subdivision_Sphere(4),  leeway: .1 }
        ];
        this.collider_selection = 0;

        this.submit_shapes( context, this.shapes );

        this.turret_angle = 0;


        this.projectiles = [];
        this.model_tank = Mat4.identity();
        this.power = 40;
        this.brick_mass = 5;
        this.ball_mass = 20;
        this.tnkposz = 0;
        this.c_toggle = false;
        this.reset = true;
        this.rotate_factor = 0;
        this.level = 1;
        this.total_ammo = 30;
        this.score = curr_level = 0;
        score_global=this.score;
        remaining_balls = this.total_ammo;
       

                                     // Make some Material objects available to you:
        this.materials =
          {   
              bump: context.get_instance(Bump_Map_Shader).material(Color.of(0,0,1,1), {ambient: 1}),
              test:     context.get_instance( Phong_Shader ).material( Color.of( 0,0,1,1 ), { ambient:1 } ),
              level: context.get_instance( Phong_Shader ).material( Color.of( 0,1,0,1 ), { ambient:1 } ),
              final: context.get_instance(Phong_Shader).material(Color.of(1,0,0,1), {ambient:1}),
              tankBody:     context.get_instance( Phong_Shader ).material( Color.of( 0.5,0.7,0.4,1 ), { ambient:0.4 } ),
              tankTreads:     context.get_instance( Phong_Shader ).material( Color.of( 0.2,0.2,0,1 ), { ambient:0.4 } ),
              turretBody:     context.get_instance( Phong_Shader ).material( Color.of( 0.3,0.5,0.2,1 ), { ambient:0.4 } ),
              ground: context.get_instance( Bump_Map_Shader ).material(Color.of(0,0,0,1), {ambient: 1, texture: context.get_instance("assets/groundhigherres.jpg", false)}),
              wall: context.get_instance( Bump_Map_Shader ).material(Color.of(0,0,0,1), {ambient: 1, texture: context.get_instance("assets/brick.png", false)}),



              sun:      context.get_instance(Bump_Map_Shader  ).material( Color.of( 249/255,215/255,28/255,1 ), { ambient:0.6 } )
            //ring:     context.get_instance( Ring_Shader  ).material()

                                // TODO:  Fill in as many additional material objects as needed in this key/value table.
                                //        (Requirement 1)
          }
        
        

        // this.setUpShader(this.gl)
        //shadow texture stuff
        // this.shadowFramebuffer = this.gl.createFramebuffer()
        // this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.shadowFramebuffer)

        this.bodiesInColumns = []
        this.freeBodies = []
        this.freeBodiesHit = {}
        this.dt = 1/20;
        this.steps_taken = 0;
        this.t = 0;
        this.time_scale = 1;
        this.dir = 1;
        this.time_accumulator = 0;
        this.lights = [ new Light( Vec.of( 5,-10,5,1 ), Color.of( 0, 1, 1, 1 ), 1000 ) ];
        

      }

//       setUpShader(gl) {
// var frame_buffer, color_buffer, depth_buffer, status;

//   // Step 1: Create a frame buffer object
//   frame_buffer = gl.createFramebuffer();

//   // Step 2: Create and initialize a texture buffer to hold the colors.
//   color_buffer = gl.createTexture();
//   gl.bindTexture(gl.TEXTURE_2D, color_buffer);
//   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1024, 1024, 0,
//                                   gl.RGBA, gl.UNSIGNED_BYTE, null);
//   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
//   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
//   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
//   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

//   // Step 3: Create and initialize a texture buffer to hold the depth values.
//   // Note: the WEBGL_depth_texture extension is required for this to work
//   //       and for the gl.DEPTH_COMPONENT texture format to be supported.
//   depth_buffer = gl.createTexture();
//   gl.bindTexture(gl.TEXTURE_2D, depth_buffer);
//   gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, 1024, 1024, 0,
//                                   gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
//   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
//   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
//   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
//   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

//   // Step 4: Attach the specific buffers to the frame buffer.
//   gl.bindFramebuffer(gl.FRAMEBUFFER, frame_buffer);
//   gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, color_buffer, 0);
//   gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,  gl.TEXTURE_2D, depth_buffer, 0);

//   // Step 5: Verify that the frame buffer is valid.
//   status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
//   if (status !== gl.FRAMEBUFFER_COMPLETE) {
//     console.log("The created frame buffer is invalid: " + status.toString());
//   }

//   // Unbind these new objects, which makes the default frame buffer the
//   // target for rendering.
//   gl.bindTexture(gl.TEXTURE_2D, null);
//   gl.bindFramebuffer(gl.FRAMEBUFFER, null);

//   return frame_buffer;

//       }
      // create_cubemap(gl) {
      //   var texture = gl.createTexture();
      //   //var depthProgramID = LoadShaders( "depthShader.vertexshader", "depthShader.fragmentshader" );
      //   //var depthMatrixID = gl.GetUniformLocation(depthProgramID, "depthMVP");

      //   gl.bindTexture(gl.TEXTURE_2D, texture);
      //   gl.TexImage2D(gl.TEXTURE_2D, 0,gl.DEPTH_COMPONENT16, 1024, 1024, 0,gl.DEPTH_COMPONENT, gl.FLOAT, 0);
      //   gl.TexParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      //   gl.TexParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      //   gl.TexParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      //   gl.TexParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      //   gl.FramebufferTexture(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, depthTexture, 0);

      //   gl.DrawBuffer(gl.NONE);

      //   if (gl.checkFramebufferStates(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE)
      //     return false;

      //   let light_position = this.lights[0].position;
      //   let depthProjectionMatrix = Mat4.orthographic(-300, 300, 0, 250, -300, 300);
      //   let depthViewMatrix = Mat4.look_at(light_position, Vec.of(0,0,0), Vec.of(0,1,0));
      //   let depthMVP = depthProjectionMatrix * depthViewMatrix * Mat4.identity();
      //   //gl.UniformMatrix4fv(depthMatrixID, 1, gl.FALSE, &depthMVP[0][0])
      // }

      resolve_collision(brick, projectile) {
        let collide_angle = Math.atan2(brick.center[1] - projectile.center[1]
                                        ,brick.center[2] - projectile.center[2])
        //console.log(collide_angle)
        let speed1 = brick.linear_velocity.length;
        let speed2 = projectile.linear_velocity.length;

        let direction1 = Math.atan2(brick.linear_velocity[1], brick.linear_velocity[2])
        let direction2 = Math.atan2(projectile.linear_velocity[1], projectile.linear_velocity[2])

        let new_xspeed_1 = speed1 * Math.cos(direction1 - collide_angle);
        let new_yspeed_1 = speed1 * Math.sin(direction1 - collide_angle);
        let new_xspeed_2 = speed2 * Math.cos(direction2 - collide_angle);
        let new_yspeed_2 = speed2 * Math.sin(direction2 - collide_angle);

        let final_xspeed_1 = ((this.brick_mass - this.ball_mass) * new_xspeed_1 + (this.ball_mass + this.ball_mass) * new_xspeed_2) / (this.brick_mass + this.ball_mass);
        let final_xspeed_2 = ((this.brick_mass + this.brick_mass) * new_xspeed_1 + (this.ball_mass - this.brick_mass) * new_xspeed_2) / (this.brick_mass + this.ball_mass);
        let final_yspeed_1 = new_yspeed_1;
        let final_yspeed_2 = new_yspeed_2;

        let cosAngle = Math.cos(collide_angle);
        let sinAngle = Math.sin(collide_angle);
        
        if(final_yspeed_1 > 0){
          final_yspeed_1 = 0;
        }

        brick.linear_velocity[2] = cosAngle * final_xspeed_1 - sinAngle * final_yspeed_1;
        brick.linear_velocity[1] = sinAngle * final_xspeed_1 + cosAngle * final_yspeed_1;
        brick.linear_velocity[0] = projectile.linear_velocity[0] / 15;
        brick.angular_velocity = collide_angle / 2;

        if(brick.linear_velocity[2] < 0){
          brick.linear_velocity[2] *= -1;
        }
        if(brick.bottom_brick){
          brick.linear_velocity[2] /= 1.2;
          brick.angular_velocity = 0;
        }
        
        projectile.linear_velocity[2] = -cosAngle * final_xspeed_2 + sinAngle * final_yspeed_2 - 10;
        projectile.linear_velocity[1] = sinAngle * final_xspeed_2 + cosAngle * final_yspeed_2;
        projectile.linear_velocity[0] /= 1.5;
      }

    update_state( dt )
    {                 // update_state():  Override the base time-stepping code to say what this particular
                      // scene should do to its bodies every frame -- including applying forces.
                      // Generate additional moving bodies if there ever aren't enough:

      for( let b of this.bodiesInColumns )
      {
        for(let body of b) {
          body.linear_velocity[1] += dt * -9.8;
                                                  // If about to fall through floor, reverse y velocity:
          if( body.center[1] < -4 && body.linear_velocity[1] < 0 )
            body.linear_velocity[1] *= -.8;
        }                                      // Gravity on Earth, where 1 unit in world space = 1 meter:

      }
      
      for(let body of this.freeBodies) {
        body.linear_velocity[1] += dt * -9.8;
                                                // If about to fall through floor, reverse y velocity:
        if( body.center[1] < -4 && body.linear_velocity[1] < 0 )
          body.linear_velocity[1] *= -.8;
      }                                      // Gravity on Earth, where 1 unit in world space = 1 meter:

      const collider = this.colliders[ this.collider_selection ];
      var i = 0, j = 0;

      //check if ball is colliding with a block

      for(let colNum = 0; colNum < this.bodiesInColumns.length; colNum++) {
        let col1 = this.bodiesInColumns[colNum]
        for (let bodyNum = 0; bodyNum < col1.length; bodyNum++) {
          let body1 = col1[bodyNum]
          for (let body2 of col1) {
            if(body2 == body1)
              continue;
            if(!body1.check_if_colliding(body2, collider)) {
              continue;
            }
            if(body1.center[1] > body2.center[1] && bodyNum != 0)
              body1.linear_velocity[1] = 0
          }

          for(let ball of this.projectiles) {
            if(!body1.check_if_colliding(ball, collider)) {
              continue;
            }

            //remove the body from column
            let newBodies = []
            for(let body of col1) {
              if(body != body1) {
                newBodies.push(body)
              } else {
                if(bodyNum == 0)
                  body.bottom_brick = true;
                else
                  body.bottom_brick = false;
                this.freeBodies.push(body)
              }
            }
            this.bodiesInColumns[colNum] = newBodies
            //resolve collision between ball and body1
            this.resolve_collision(body1, ball)
          }
        }
      }

      for (let bodyNum = 0; bodyNum < this.freeBodies.length; bodyNum++) {
        let body1 = this.freeBodies[bodyNum]
        body1.linear_velocity[2] /= 1.004;
        body1.linear_velocity[0] /= 1.002;
        body1.angular_velocity /= 1.01;

        if(body1.linear_velocity[2] < 2 && body1.linear_velocity[0] < 1){
          this.freeBodies.splice(bodyNum, 1);
          bodyNum--;
          continue;
        }
      }

      for (let a of this.projectiles) {
        a.linear_velocity[1] += dt * -9.8;

        if(a.center[1] < -9) {
          a.linear_velocity[0] *= 0.9
          a.linear_velocity[1] *= -0.7
          a.linear_velocity[2] *= 0.7
        }

      }
                                               // Delete bodies that stop or stray too far away:
      //this.bodies = this.bodies.filter( b => b.center.norm() < 50 && b.linear_velocity.norm() > 2 );
    }

    simulate( frame_time )
    {                                     // simulate(): Carefully advance time according to Glenn Fiedler's
                                          // "Fix Your Timestep" blog post.
                                          // This line gives ourselves a way to trick the simulator into thinking
                                          // that the display framerate is running fast or slow:
      frame_time = this.time_scale * frame_time;

                                          // Avoid the spiral of death; limit the amount of time we will spend
                                          // computing during this timestep if display lags:
      this.time_accumulator += Math.min( frame_time, 0.1 );
                                          // Repeatedly step the simulation until we're caught up with this frame:
      while ( Math.abs( this.time_accumulator ) >= this.dt )
      {                                                       // Single step of the simulation for all bodies:
        this.update_state( this.dt );
        for( let b of this.bodiesInColumns ) {
          for(let body of b) {
            body.advance(this.dt)
          }
        }

        for(let body of this.freeBodies) {
          body.advance(this.dt)
        }

        for( let p of this.projectiles )
          p.advance( this.dt );
                                          // Following the advice of the article, de-couple
                                          // our simulation time from our frame rate:
        this.t += Math.sign( frame_time ) * this.dt;
        this.time_accumulator -= Math.sign( frame_time ) * this.dt;
        this.steps_taken++;
      }
                                            // Store an interpolation factor for how close our frame fell in between
                                            // the two latest simulation time steps, so we can correctly blend the
                                            // two latest states and display the result.
      let alpha = this.time_accumulator / this.dt;
      for(let bodies of this.bodiesInColumns) {
        for( let b of bodies ) b.blend_state( alpha );
      }
      for( let b of this.freeBodies ) b.blend_state( alpha );

      for( let p of this.projectiles ) p.blend_state( alpha );
    }

    make_control_panel()            // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
      { this.key_triggered_button( "Increase turret angle",  [ "w" ], () => {
        if(this.turret_angle + 5 < 45) {
          this.turret_angle += 5; //add 5 degrees
        }
      } );
        this.key_triggered_button( "Decrease turret angle", [ "s" ], () => {
          if(this.turret_angle - 5 >= 0) {
            this.turret_angle -= 5;
          }
        } );
        this.new_line();
        this.key_triggered_button( "Fire cannon", [ " " ], () => {
          this.total_ammo -= 1;
          remaining_balls = this.total_ammo;
          if(this.total_ammo != 2){
            this.projectiles.push(new Body(this.shapes.ball, this.materials.test, vec3(1,1,1))
              .emplace(this.model_tank.times(Mat4.translation([0,2,6])), vec3(this.power*Math.sin(this.rotate_factor),this.power * Math.sin(this.turret_angle*(Math.PI/180.0))*Math.cos(this.rotate_factor),this.power * Math.cos(this.turret_angle*(Math.PI/180.0))), 0, vec3(1,0,0) ));
          }   
          else {
            this.projectiles.push(new Body(this.shapes.ball, this.materials.final, vec3(1,1,1))
              .emplace(this.model_tank.times(Mat4.translation([0,2,6])), vec3(this.power*Math.sin(this.rotate_factor),this.power * Math.sin(this.turret_angle*(Math.PI/180.0))*Math.cos(this.rotate_factor),this.power * Math.cos(this.turret_angle*(Math.PI/180.0))), 0, vec3(1,0,0) ));
          }
        } );
        this.new_line();
        // this.key_triggered_button( "MoveUp", [ "u" ], () => {
        //   this.tnkposz += 1;
        // } );

        // this.key_triggered_button( "MoveDown", [ "j" ], () => {
        //   this.tnkposz -= 1;
        // } );
        // this.new_line();

        this.key_triggered_button( "Restart", [ "r" ], () => {
          this.reset = true;
          this.level = 0;
          curr_level = 0;
          status = 0;
          this.total_ammo = 30;
          remaining_balls = this.total_ammo;
        } );
        this.new_line();
        this.key_triggered_button( "RotRight", [ "a" ], () => {
          if (this.rotate_factor < Math.PI/3)
            this.rotate_factor += Math.PI/180 * 2;
          //this.tnkposz +=1;
        } );

        this.key_triggered_button( "RotLeft", [ "d" ], () => {
          if (this.rotate_factor > -Math.PI/3)
            this.rotate_factor -= Math.PI/180 * 2;
          //this.tnkposz += 1;
        } );
        this.new_line();
        this.key_triggered_button( "Switch Camera", [ "c" ], () => {
          this.c_toggle = !this.c_toggle;
        } );
      }

    create_ground(graphics_state, model_transform) {
        model_transform = model_transform.times( Mat4.translation( [0,-10,0] )).times( Mat4.rotation( Math.PI/2,   Vec.of(1,0,0) ) ).times( Mat4.scale( [300,300,1] ) );

        this.shapes.square.draw( graphics_state,  model_transform ,
            this.materials.ground);
        model_transform = model_transform.times(Mat4.scale([1/300, 1/300,1])).times(Mat4.rotation(Math.PI/2, Vec.of(-1,0,0)))
        model_transform = model_transform.times(Mat4.translation([0,1,0]))
        return model_transform;
    }

    create_wall1_2(graphics_state, model_transform) {
        if(this.level == 0 || this.level == 4)
          model_transform = model_transform.times(Mat4.translation([-40,3,0]));
        else if(this.level == 1) 
          model_transform = model_transform.times(Mat4.translation([-40,3,30]));
        else if (this.level == 2)
          model_transform = model_transform.times(Mat4.translation([-40,3,100]));


        for(var i = 0; i < 12; i++) {
          let bodies = []
            for(var j = 0; j < 3; j++) {

                bodies.push(new Body(this.shapes.block_texture, this.materials.wall, vec3(4,4,1))
                    .emplace(model_transform, vec3(0,0,0), 0, vec3(1,0,0) ));
                model_transform= model_transform
                    .times( Mat4.translation([0,8,0]))
                //this.shapes.block.draw(graphics_state, model_transform, this.materials.test);
            }
            this.bodiesInColumns.push(bodies)
            model_transform = model_transform
                .times( Mat4.translation([8, -24,0]));
        }
        return model_transform;

    }


    create_wall4(graphics_state, model_transform) {
        model_transform = model_transform.times(Mat4.translation([-130,3,35]));


        for(var i = 0; i < 6; i++) {
          let bodies = []
            for(var j = 0; j < 3; j++) {

                bodies.push(new Body(this.shapes.block_texture, this.materials.wall, vec3(4,4,1))
                    .emplace(model_transform, vec3(0,0,0), 0, vec3(1,0,0) ));
                model_transform= model_transform
                    .times( Mat4.translation([0,8,0]))
                //this.shapes.block.draw(graphics_state, model_transform, this.materials.test);
            }
            this.bodiesInColumns.push(bodies)
            model_transform = model_transform
                .times( Mat4.translation([8, -24,0]));
        }

        if(this.level == 3)
          model_transform = model_transform.times(Mat4.translation([100,0,55]));
        else if(this.level == 4) 
          model_transform = model_transform.times(Mat4.translation([170,0,25]));

        

        for(var i = 0; i < 6; i++) {
          let bodies = []
            for(var j = 0; j < 3; j++) {

                bodies.push(new Body(this.shapes.block_texture, this.materials.wall, vec3(4,4,1))
                    .emplace(model_transform, vec3(0,0,0), 0, vec3(1,0,0) ));
                model_transform= model_transform
                    .times( Mat4.translation([0,8,0]))
                //this.shapes.block.draw(graphics_state, model_transform, this.materials.test);
            }
            this.bodiesInColumns.push(bodies)
            model_transform = model_transform
                .times( Mat4.translation([8, -24,0]));
        }



        return model_transform;

    }

    isempty(){
      for (let col of this.bodiesInColumns) {
        if (col.length != 0) 
          return false;
      }
      return true;
    }

    create_tank(graphics_state, model_transform) {
        let orig_transform = model_transform;
        //model_transform = orig_transform.times(Mat4.scale([ 2,1,3 ]))
        //this.shapes.block.draw( graphics_state, model_transform, this.materials.tankBody );

        model_transform = orig_transform.times(Mat4.translation([0, 2.5, 0])).times(Mat4.scale([ 3,0.5,5.5 ]))
        this.shapes.block.draw( graphics_state, model_transform, this.materials.tankBody );

        model_transform = orig_transform.times(Mat4.translation([0, 1, 0])).times(Mat4.scale([ 4,1,6 ]))
        this.shapes.block.draw( graphics_state, model_transform, this.materials.tankBody );

        model_transform = orig_transform.times(Mat4.translation([0, 0.25, 0])).times(Mat4.scale([ 4,1,6.5 ]))
        this.shapes.block.draw( graphics_state, model_transform, this.materials.tankBody );

        model_transform = orig_transform.times(Mat4.translation([4.75, 0, 0])).times(Mat4.scale([ -0.75,1,6 ]))
        this.shapes.block.draw( graphics_state, model_transform, this.materials.tankTreads );

        model_transform = orig_transform.times(Mat4.translation([-4.75, 0, 0])).times(Mat4.scale([ 0.75,1,6 ]))
        this.shapes.block.draw( graphics_state, model_transform, this.materials.tankTreads );
    }

    create_turret(graphics_state, model_transform) {
        let orig_transform = model_transform;
        model_transform = orig_transform.times(Mat4.translation([0, 4, 0])).times(Mat4.scale([ 2,1,3 ]))
        this.shapes.block.draw( graphics_state, model_transform, this.materials.turretBody );

        model_transform = orig_transform.times(Mat4.translation([0, 4, 3])).times(Mat4.scale([ 0.25,0.25,6 ]))
        this.shapes.block.draw( graphics_state, model_transform, this.materials.turretBody );
    }

//     create_level_blips(graphics_state, offset){
//         let levelScale = Mat4.identity().times(Mat4.scale([1,1,1]));
//         levelScale = levelScale.times(Mat4.translation(Vec.of(105-offset,60,0)));
//         this.shapes.ball.draw(graphics_state, levelScale, this.materials.level);
//     }

    display( graphics_state )
      {

        graphics_state.lights = this.lights;        // Use the lights stored in this.lights.
        

        const t = graphics_state.animation_time / 1000, dt = graphics_state.animation_delta_time / 1000;
        let sunRadius = 10;
        let sunColor = Color.of(249/255, 215/255, 28/255);
        let sunScale = Mat4.identity().times(Mat4.scale([sunRadius, sunRadius, sunRadius]));
        sunScale = sunScale.times(Mat4.translation(Vec.of(-10,5,10)));
        graphics_state.lights = [ new Light( Vec.of(-10,10,-10,1), sunColor, 10**sunRadius) ];
        this.shapes.sun.draw(graphics_state, sunScale, this.materials.sun);
        
        //this.create_level_blips(graphics_state, 0);
        this.simulate( graphics_state.animation_delta_time );

        if (this.total_ammo == 0) {
          status = 2;
          this.reset = true;
          this.total_ammo = 40;
          remaining_balls = this.total_ammo;
          this.score = 0;
          curr_level = 0;
          this.level = 0;
          return;
        }
        // create 3 tanks
        this.model_tank = Mat4.translation([10 - 4.75,-9,-80])//.times(Mat4.rotation(this.rotate_factor, Vec.of(0,1,0))).times(Mat4.translation([4.75, 0, 0]));

        this.create_tank(graphics_state, this.model_tank);
        //draw test axis
        // this.shapes.ball.draw(graphics_state, model_tank.times(Mat4.translation([0,3,-3 ])), this.materials.test);
        this.model_tank = this.model_tank.times(Mat4.translation([0, 3, -3]))
            .times( Mat4.rotation(this.turret_angle * (Math.PI / 180.0), Vec.of(-1,0,0)) )
            .times(Mat4.rotation(this.rotate_factor, Vec.of(0,1,0)))
            .times(Mat4.translation([0, -3, 3]));
        this.create_turret(graphics_state, this.model_tank);

        // model_tank = Mat4.identity().times(Mat4.translation([40,-9,-80]));
        //
        // this.create_tank(graphics_state, model_tank);
        // this.create_turret(graphics_state, model_tank);
        //
        // model_tank = Mat4.identity().times(Mat4.translation([25,-9,-60]));
        //
        // this.create_tank(graphics_state, model_tank);
        // this.create_turret(graphics_state, model_tank);



        // handle wall and ground

        let model_transform = Mat4.identity().times(Mat4.scale([4,4,1]));

        model_transform = this.create_ground(graphics_state, Mat4.identity());
        if (status == 1 || status == 2) {
          return;
        }
        

        if(this.reset) {
          this.bodiesInColumns = []
          this.freeBodies = []
          this.freeBodiesHit = {}
          this.projectiles = []
          if (this.level <= 2 || this.level == 4) {
            model_transform = this.create_wall1_2(graphics_state, model_transform);
          }
          else if(this.level <=3) {
            model_transform = this.create_wall4(graphics_state, model_transform);
          }


          //this.physics_on_one_block(graphics_state, Mat4.identity())
          this.reset = false;
        }
        if(this.level == 4) {
          for(let bodies of this.bodiesInColumns) {
            for(let body of bodies) {
              body.linear_velocity[2] = 0;
              if(this.dir == 1){
                body.center[2] += 1;
              }
              else {
                body.center[2] -= 1;
              }
              if(body.center[2] < -20) {
                this.dir = 1;
              } else if (body.center[2] > 70 ) {
                this.dir = 2;
              }

            }
          }
        }

        if (this.isempty()) {
          if(this.level == 4) {
            status = 1;
          }
          this.reset = true;
          this.level += 1;
          curr_level += 1;
          this.score += this.total_ammo;
          score_global=this.score;
          this.total_ammo = 40 + 5*(this.level-1);
         remaining_balls = this.total_ammo;

          //this.create_level_blips(graphics_state, 5*(this.level-1));
          
        }

        // for( let b of this.bodies ) {
        // 	b.shape.draw( graphics_state, b.drawn_location, b.material );
        // }

        for(let bodies of this.bodiesInColumns) {
          for(let body of bodies) {
            body.shape.draw(graphics_state, body.drawn_location, body.material)

          }
        }
        for(let body of this.freeBodies) {
          body.shape.draw(graphics_state, body.drawn_location, body.material)
        }

        // console.log(this.projectiles);
        for( let p of this.projectiles) {
          p.shape.draw(graphics_state, p.drawn_location, p.material);
        }


        // taking care of camera :)
        let desired = Mat4.identity()
        if (this.c_toggle) {
          let mod = this.model_tank.times(Mat4.translation([0,4,12])).times(Mat4.rotation(Math.PI, Vec.of(0,1,0)));
          desired = Mat4.inverse(mod);
        } else {
          desired = Mat4.inverse(this.initial_camera_location);
        }
        desired = desired.map( (x,i) => Vec.from( graphics_state.camera_transform[i] ).mix( x, 0.1 ));
        graphics_state.camera_transform = desired;


      }
  }

window.Cube_P = window.classes.Cube_P =
class Cube_P extends Shape    // A cube inserts six square strips into its arrays.
{ constructor()
    { super( "positions", "normals", "texture_coords" );
      for( var i = 0; i < 3; i++ )
        for( var j = 0; j < 2; j++ )
        { var square_transform = Mat4.rotation( i == 0 ? Math.PI/2 : 0, Vec.of(1, 0, 0) )
                         .times( Mat4.rotation( Math.PI * j - ( i == 1 ? Math.PI/2 : 0 ), Vec.of( 0, 1, 0 ) ) )
                         .times( Mat4.translation([ 0, 0, 1 ]) );
          Square.insert_transformed_copy_into( this, [], square_transform );
        }
    }
}

window.Cube = window.classes.Cube =
    class Cube extends Shape                 // Here's a complete, working example of a Shape subclass.  It is a blueprint for a cube.
    { constructor()
    { super( "positions", "normals", "texture_coords" ); // Name the values we'll define per each vertex.  They'll have positions and normals.

        // First, specify the vertex positions -- just a bunch of points that exist at the corners of an imaginary cube.
        this.positions.push( ...Vec.cast( [-1,-1,-1], [1,-1,-1], [-1,-1,1], [1,-1,1], [1,1,-1],  [-1,1,-1],  [1,1,1],  [-1,1,1],
            [-1,-1,-1], [-1,-1,1], [-1,1,-1], [-1,1,1], [1,-1,1],  [1,-1,-1],  [1,1,1],  [1,1,-1],
            [-1,-1,1],  [1,-1,1],  [-1,1,1],  [1,1,1], [1,-1,-1], [-1,-1,-1], [1,1,-1], [-1,1,-1] ) );
        // Supply vectors that point away from eace face of the cube.  They should match up with the points in the above list
        // Normal vectors are needed so the graphics engine can know if the shape is pointed at light or not, and color it accordingly.
        this.normals.push(   ...Vec.cast( [0,-1,0], [0,-1,0], [0,-1,0], [0,-1,0], [0,1,0], [0,1,0], [0,1,0], [0,1,0], [-1,0,0], [-1,0,0],
            [-1,0,0], [-1,0,0], [1,0,0],  [1,0,0],  [1,0,0], [1,0,0], [0,0,1], [0,0,1], [0,0,1],   [0,0,1],
            [0,0,-1], [0,0,-1], [0,0,-1], [0,0,-1] ) );

        this.texture_coords.push( ...Vec.cast([0,0], [1, 0], [1,1], [0,1], [0, 0], [1,0], [1,1], [0,1], [0,0], [1, 0], [1, 1], [0, 1], [0, 0], [1, 0], [1, 1], [0, 1], [0, 0], [1, 0], [1, 1], [0, 1]));

        // Those two lists, positions and normals, fully describe the "vertices".  What's the "i"th vertex?  Simply the combined
        // data you get if you look up index "i" of both lists above -- a position and a normal vector, together.  Now let's
        // tell it how to connect vertex entries into triangles.  Every three indices in this list makes one triangle:
        this.indices.push( 0, 1, 2, 1, 3, 2, 4, 5, 6, 5, 7, 6, 8, 9, 10, 9, 11, 10, 12, 13,
            14, 13, 15, 14, 16, 17, 18, 17, 19, 18, 20, 21, 22, 21, 23, 22 );
        // It stinks to manage arrays this big.  Later we'll show code that generates these same cube vertices more automatically.
    }
    }


window.Bump_Map_Shader = window.classes.Bump_Map_Shader = 
class Bump_Map_Shader extends Phong_Shader                         
{ fragment_glsl_code()            
    { return `
        uniform sampler2D texture;
        void main()
        { if( GOURAUD || COLOR_NORMALS )    
          { gl_FragColor = VERTEX_COLOR;              
            return;
          }                                 
                                           
          
          vec4 tex_color = texture2D( texture, f_tex_coord );  
          vec3 normal = normalize(N * 10.0- - 1.0);                  
          vec3 bumps  = normalize( normal + tex_color.rgb - 0.8*vec3(1,1,1) );      
                                                                                 
                                                                                 
                                                                                 
          if( USE_TEXTURE ) gl_FragColor = vec4( ( tex_color.xyz + shapeColor.xyz ) * ambient, shapeColor.w * tex_color.w ); 
          else gl_FragColor = vec4( shapeColor.xyz * ambient, shapeColor.w );
          gl_FragColor.xyz += phong_model_lights( bumps );                    
        }`;
    }
}

window.Wall_Shader = window.classes.Ring_Shader =
class Ring_Shader extends Shader              // Subclasses of Shader each store and manage a complete GPU program.
{ material() { return { shader: this } }      // Materials here are minimal, without any settings.
  map_attribute_name_to_buffer_name( name )       // The shader will pull single entries out of the vertex arrays, by their data fields'
    {                                             // names.  Map those names onto the arrays we'll pull them from.  This determines
                                                  // which kinds of Shapes this Shader is compatible with.  Thanks to this function, 
                                                  // Vertex buffers in the GPU can get their pointers matched up with pointers to 
                                                  // attribute names in the GPU.  Shapes and Shaders can still be compatible even
                                                  // if some vertex data feilds are unused. 
      return { object_space_pos: "positions" }[ name ];      // Use a simple lookup table.
    }
    // Define how to synchronize our JavaScript's variables to the GPU's:
  update_GPU( g_state, model_transform, material, gpu = this.g_addrs, gl = this.gl )
      { const proj_camera = g_state.projection_transform.times( g_state.camera_transform );
                                                                                        // Send our matrices to the shader programs:
        gl.uniformMatrix4fv( gpu.model_transform_loc,             false, Mat.flatten_2D_to_1D( model_transform.transposed() ) );
        gl.uniformMatrix4fv( gpu.projection_camera_transform_loc, false, Mat.flatten_2D_to_1D(     proj_camera.transposed() ) );
      }
  shared_glsl_code()            // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    { return `precision mediump float;
              varying vec4 position;
              varying vec4 center;
      `;
    }
  fragment_glsl_code()           // ********* FRAGMENT SHADER *********
    { return `
        uniform sampler2D texture;
        void main()
        { 
          vec4 tex_color = texture2D( texture, f_tex_coord );    
          if( USE_TEXTURE ) gl_FragColor = vec4( ( tex_color.xyz + shapeColor.xyz ) * ambient, shapeColor.w * tex_color.w ); 
          else gl_FragColor = vec4( shapeColor.xyz * ambient, shapeColor.w );
         
        }`;           // TODO:  Complete the main function of the fragment shader (Extra Credit Part II).
    }
}


window.Cube = window.classes.Cube =
class Cube extends Shape    // A cube inserts six square strips into its arrays.
{ constructor(val = 1)  
    { super( "positions", "normals", "texture_coords" );
      for( var i = 0; i < 3; i++ )                    
        for( var j = 0; j < 2; j++ )
        { var square_transform = Mat4.rotation( i == 0 ? Math.PI/2 : 0, Vec.of(1, 0, 0) )
                         .times( Mat4.rotation( Math.PI * j - ( i == 1 ? Math.PI/2 : 0 ), Vec.of( 0, 1, 0 ) ) )
                         .times( Mat4.translation([ 0, 0, 1 ]) );
          if(val === 1)
            Square.insert_transformed_copy_into( this, [], square_transform );
          if(val === 2)
            Square_2.insert_transformed_copy_into( this, [], square_transform )
        }
    }
}
