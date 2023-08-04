const default_spring_parameters = {
    tension: 60,
    friction: 10,
    mass: 1,
    min_velocity: 0.001,
    precision: 0.01,
    clamp: false,
    step_duration: 1/1000,
    start_position: 0,
    end_position: 1,
    start_delay: 0,
    time_factor: 1,
    loop: false,
    maintainVelocity: true,
}

const default_spring_state = {
    position: 0,
    velocity: 0,
    started: false,
    start_time: 0,
    finished: false,
    active: false,
    cycle: 0,
}

export class SpringAnimation {

    constructor(parameters) {
        this.default_state = default_spring_state;
        this.setParameters(parameters);
        this.reset();
    }
    setParameters(parameters) {
        this.params = {...default_spring_parameters,...parameters};
    }
    reset() {
        this.state = JSON.parse(JSON.stringify(this.default_state));
    }
    update(delta_time,elapsed_time=0) {
        update_spring(this.params, this.state, delta_time, elapsed_time);
        if (this.state.finished && this.params?.loop) {
            const velocity = this.state.velocity;
            const cycle = this.state.cycle;
            this.reset();
            if (this.params.maintainVelocity) {
                this.state.velocity = velocity;
            }
            this.state.cycle = cycle+1;
            this.activate();
        }
    }
    getPosition() {
        return this.state.position;
    }
    activate() {
        this.state.active = true;
    }
    deactivate() {
        this.state.active = false;
    }
    isActive() {
        return this.state.active;
    }
}

const update_spring = (params, state, delta_time,elapsed_time) => {

    if (state.finished) {
        return;
    }
    else if (!state.started) {
        state.start_time = elapsed_time;
        state.started = true;
    }
    if (params.start_delay && (params.start_delay>elapsed_time-state.start_time)) {
        return;
    }

    let position = state.position;
    let velocity = state.velocity;
    
    const step_duration = params.step_duration*params.time_factor; // 1ms or 1/1000 second step duration
    const num_steps = Math.ceil((delta_time*params.time_factor) / step_duration); // take the ceiling since you can't run a  "partial" step

    for (let i = 0; i < num_steps; i++) {
        const tension_force = params.tension * 0.000001 * (params.end_position - position);
        const damping_force = -params.friction * 0.001 * velocity;
        const acceleration = (tension_force + damping_force) / params.mass;

        velocity = velocity + acceleration*(step_duration*1000);
        position = position + velocity*(step_duration*1000);
    }

    // update velocity and position state once done with all the steps
    state.position = position;
    state.velocity = velocity;

    const finished = (params.clamp && position >= params.end_position) ||
        (Math.abs(velocity) < params.min_velocity &&
            Math.abs(position - params.end_position) < params.precision);

    if (finished) {
        state.finished = true;
        state.position = params.end_position;

    }
}





const default_linear_parameters = {
    speed: 1,
    start: 0,
    end: 1,
    start_delay: 0,
}

const default_linear_state = {
    position: 0,
    started: false,
    start_time: 0,
    finished: false,
    active: false,
}

export class LinearAnimation {

    constructor(parameters) {
        this.default_state = default_linear_state;
        this.setParameters(parameters);
        this.reset();
    }
    setParameters(parameters) {
        this.params = {...default_linear_parameters,...parameters};
    }
    reset() {
        this.state = JSON.parse(JSON.stringify(this.default_state));
    }
    update(elapsed_time) {
        update_linear(this.params, this.state, elapsed_time);
    }
    getPosition() {
        return this.state.position;
    }
    activate() {
        this.state.active = true;
    }
    deactivate() {
        this.state.active = false;
    }
    isActive() {
        return this.state.active;
    }
}

const update_linear = (params, state, elapsed_time) => {

    if (state.finished) {
        return;
    }
    
    if (!state.started) {
        state.start_time = elapsed_time;
        state.started = true;
    }
    if (params.start_delay && (params.start_delay>elapsed_time-state.start_time)) {
        return;
    }

    const animation_elapsed_time = elapsed_time - state.start_time - params.start_delay;

    let position = params.start + params.speed*animation_elapsed_time;
    position = Math.min(position, params.end);

    state.position = position;

    const finished = position >= params.end;

    if (finished) {
        state.finished = true;
    }
}