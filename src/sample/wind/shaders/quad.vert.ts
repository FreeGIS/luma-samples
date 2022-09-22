const quadVert = `#version 300 es
precision mediump float;
in vec2 a_pos;
out vec2 v_tex_pos;
void main() {
    v_tex_pos = a_pos;
    // 纹理坐标0-1转webgl坐标 -1 - 1
    gl_Position = vec4(1.0 - 2.0 * a_pos, 0, 1);
}`;
export default quadVert;
