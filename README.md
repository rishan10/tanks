# Members
Ankith Uppunda, auppunda

Rishan Girish, rishan10

Aseem Sane, aseem191

Andrew Zeff, apzsfo

# How to run
To run the project, run the `host.command` file and go to http://localhost:8000/ in your browser.

# Project Details
Team Name: **Tanks**

Our project is a **Tank** game. The motivation is taken from brick-breaker but basically you have limited ammo and the point of the game is to destroy the wall with the ammo you have. You have one tank and you can either choose to have a third person view or a first person view with a toggle button - c (for camera). The controls are as follows: to move the tank turret up you press w (moves 5 degrees at a time), for down you press s, for right you press d, and for left you press a. To fire ammo, the player needs to press space. There are 5 levels, each level getting progressively harder. Once you finish all 5 levels, your score is the amount of balls you have left over after completing each level. Once you destroy all the blocks in one level, it moves on to the next level. 


# Contributions

Ankith - I worked on the movement of the Tanks, the camera locations, collisions, and the wall. I also implemented inertia for one block, before making the wall, which helped us implement the inertia for the wall. The advanced feature that I helped implement was collision detection. The detection that I implemented was for the wall, where the each block detects that that they are colliding with the block above, below and to the sides. This makes the block stay in place, but the moment no block is colliding with it below it gets a gravity velocity. The other thing that I did was make the texture for the wall and the floor, and changed the color of the background to light blue. Along with this, I worked on the camera placement allowing for first person shooting, where the camera aligns in front of the tank turret. I also worked on the turning of the tank, where the tank can turn right or left. This allows people to hit every block on the wall. Eventually we decided to scrap the feature of the tank turning left and right, so I added it to the turret, where the tank is still but the turret can turn right and left. This allowed us to fire at any block in the wall. I also worked on tank positioning and wall positioning in the world, as in places the tank and the wall in the right place in respect to the ground.

The data structures that I used was arrays to store each body for the wall. We also use javascript objects to store our collection of shapes and materials. Overall, the changes I made were integral to game play, as they outlined the look of the world and the gameplay itself. My work with collision detection helped the development of the collisions with ammo and blocks as it set up the backbone of our physics. The textures that I added made the graphics more realistic, and made our wall actually look like a brick wall. It also added a sky. My work with cameras allowed for first person viewing, where the player can shoot in first person.


Rishan - I worked on firing projectiles from the tanks at different angles, projectile-to-block collisions, creating the wall of blocks, and adding gravity to the world. The advanced feature I worked on was collision detection between the projectiles fired and the blocks in the wall. Using the Collisions Demo, I added an array of bodies specifically for projectiles, and created an algorithm that checks if any projectile is colliding with a block, and then added a resolve_collision() function which bounces the ball off of the block. The block is also deleted from the “bodies” array once it is hit by the ball, to show that the block has been smashed. Another advanced feature I added was physics in our world. This was done by adapting the Inertia Demo to add gravity for the blocks in the wall and the projectiles to simulate projectile motion. Along with this, I enabled the firing of the projectiles from the tank. I used matrix rotations in order to increase and decrease the angle of the turret, so that the projectiles can be aimed with a greater range. This also makes my implementation of the world physics more prominent and appear more realistic, as we can observe the work of gravity on projectiles being fired from various angles. 

An optimization that I made was to the Collision Detection for the blocks in the wall. Earlier, we used to set the block’s y-velocity to 0 if we detected a collision with another block. However, this was troublesome when a block was colliding with a block directly above it or to the sides, causing some blocks to look suspended in the air and creating a very unrealistic simulation. To fix this, I created a 2D array to hold the bodies for each block in the wall by column. This enabled me to check collisions by column in the wall and only set the block’s y-velocity to 0 when it was colliding with the floor or a block directly below it. The effect of this optimization made the simulation of the crumbling wall more realistic as blocks smashed at the bottom-most level will cause all the blocks above it to crumble down.

Andrew - The advanced features I worked on were the physics of the ball projectiles and bump mapping. When the turret swiveled, I needed the trajectory of the balls to match that angle. As a result, I had to examine when the shoot button was pressed and modify the particular vector corresponding to the direction that the balls were being shot. I had to take into account the sine and cosine of the rotate_factor angle for the turret. Initially, an issue I had was that the balls would veer left or right unexpectedly whenever the turret was firing at an angle, but I examined the different vectors of the trajectory path and figured out a solution. I also added a sun and added different lighting to different parts of the map to highlight both the tank and the wall. In addition, I made the penultimate projectile a different color from the rest to signify the depletion of ammo. I also worked on implementing a score panel to keep track of levels and the amount of ammunition remaining by designing an additional class. Initially I wrote a function to show green spheres on the screen marking each level, but I did away with that.

The main advanced feature I worked on was bump mapping. I wrote a custom class that overrides the Phong Shader. I had to override the fragment_glsl_code function by changing the direction of the normals so that, when we zoomed in on the wall, the lighting would make the wall appear to be bumpy/realistic. Initially, I tried overriding the update_GPU function from the Phong Shader by using activeTexture, uniform1i, and bindTexture. This would set the state to bind a texture to a texture slot and feed that information to the GPU. However, we optimized the Bump shader by doing away with update_GPU and adjusting the normals and lighting in the fragment_glsl_code to reflect a rugged surface on the wall. When zooming in on the wall in first person, bump mapping gave our game a more realistic feel.

Aseem - The advanced features I contributed to were the block collision and the physics-based simulation. I contributed to the resolve_collision function in order to accurately display collisions on screen, where each ball would have an x, y, and z component and would collide with the wall realistically. I added physics-based movements, such as angular velocity and movement across all directions upon impact. I fixed many different errors with collisions, such as the ball not reacting quickly to collision, the wall falling unrealistically, and the ball not slowing down upon some impacts. I optimized the solution by making sure that only one collision occurred between every ball-brick pair, and ensured that both went in the correct directions after impact. I used the Body class to store the velocities and physics states of each of the colliding components. I used the list and map data structures to store all of the columns of bricks and collided bricks individually, and clear them out efficiently. I made sure these data structures were different for still standing bricks and collided bricks, in order to ensure that each brick would only collide once. In addition to collisions, I created the tank and turret models, which could be placed down easily using the same matrix. I also created higher quality textures and a better environment for the tank and walls. This, along with the collision additions, helped form the base visuals for the game, which relies on the impact between the balls and bricks. 

# Citations

We used the inertia-demo and the collision demo structure and we used part of the tiny graphics library: https://github.com/encyclopedia-of-code/tiny-graphics-js

We used some google images and we used texture code from project 4. We also adapted some code from this blog in order to take care of collisions: https://blogs.msdn.microsoft.com/faber/2013/01/09/elastic-collisions-of-balls/

# Advanced Features

Collision detection, advanced Physics (ball projectile, bouncing, with friction, angular velocity on blocks, blocks have no friction, collision detection block, ball and block block), bump mapping (on the wall when it is in the light source)



