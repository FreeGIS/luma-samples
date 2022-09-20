const drawVert = `#version 300 es
precision mediump float;
in vec2 position;
out vec2 v_particle_pos;
void main() {
    gl_PointSize = 1.0;
    gl_Position = vec4(2.0 * position.x - 1.0, 1.0 - 2.0 * position.y, 0, 1);
    v_particle_pos = position;
}`;
export default drawVert;
