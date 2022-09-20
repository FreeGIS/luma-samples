const transformVs = `#version 300 es
precision highp float;

uniform sampler2D u_wind;
uniform vec2 u_wind_min;
uniform vec2 u_wind_max;
uniform float u_rand_seed;
uniform float u_speed_factor;
uniform float u_drop_rate;
uniform float u_drop_rate_bump;

in vec2 position;
out vec2 vPosition;

// pseudo-random generator
const vec3 rand_constants = vec3(12.9898, 78.233, 4375.85453);
float rand(const vec2 co) {
    float t = dot(rand_constants.xy, co);
    return fract(sin(t) * (rand_constants.z + t));
}

// wind speed lookup; use manual bilinear filtering based on 4 adjacent pixels for smooth interpolation
vec2 lookup_wind(const vec2 uv) {
    // return texture(u_wind, uv).rg; // lower-res hardware filtering
    // textureSize获取的是整数，要转float类型方便计算。
    vec2 u_wind_res = vec2(textureSize(u_wind,0));
    vec2 px = 1.0 / u_wind_res;
    vec2 vc = (floor(uv * u_wind_res)) * px;
    vec2 f = fract(uv * u_wind_res);
    vec2 tl = texture(u_wind, vc).rg;
    vec2 tr = texture(u_wind, vc + vec2(px.x, 0)).rg;
    vec2 bl = texture(u_wind, vc + vec2(0, px.y)).rg;
    vec2 br = texture(u_wind, vc + px).rg;
    return mix(mix(tl, tr, f.x), mix(bl, br, f.x), f.y);
}


void main() {
    vec2 velocity = mix(u_wind_min, u_wind_max, lookup_wind(position));
    float speed_t = length(velocity) / length(u_wind_max);

    // take EPSG:4236 distortion into account for calculating where the particle moved
    float distortion = cos(radians(position.y * 180.0 - 90.0));
    vec2 offset = vec2(velocity.x / distortion, -velocity.y) * 0.0001 * u_speed_factor;

    // update particle position, wrapping around the date line
    vec2 pos = fract(1.0 + position + offset);

    // a random seed to use for the particle drop
    vec2 seed = pos * u_rand_seed;

    // drop rate is a chance a particle will restart at random position, to avoid degeneration
    float drop_rate = u_drop_rate + speed_t * u_drop_rate_bump;
    float drop = step(1.0 - drop_rate, rand(seed));

    vec2 random_pos = vec2(
        rand(seed + 1.3),
        rand(seed + 2.1));
    vPosition = mix(pos, random_pos, drop);
}
`;

export default transformVs;